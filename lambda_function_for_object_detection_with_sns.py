import json
import boto3
import object_detection_v2 as od
import urllib.parse

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')
img_table = dynamodb.Table("imagesTable")
tag_table = dynamodb.Table("tagsTable")
mid_table = dynamodb.Table("imageTagMiddleTable")
subscription_table = dynamodb.Table("subscriptionTable")
STANDARD_FOLDER = "standard_images/"
RESIZED_FOLDER = 'resized_images/'
SNS_ARN = "arn:aws:sns:us-east-1:703013977731:pixtag-sns"

def group_tags(tags):
    tag_counts = {}
    for tag in tags:
        if tag in tag_counts:
            tag_counts[tag] += 1
        else:
            tag_counts[tag] = 1
    return tag_counts

def get_user_subscription(email):
    subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=SNS_ARN)
    for subscription in subscriptions['Subscriptions']:
        if subscription['Endpoint'] == email:
            return subscription['SubscriptionArn']
    return None

def lambda_handler(event, context):
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        decoded_key = urllib.parse.unquote_plus(key)
        print(f"decoded_key, {decoded_key}")
        
        # Extract username, image name and image id
        parts = decoded_key.split('/')
        username = parts[1]
        email = parts[1]
        image_name = parts[2]
        image_id = image_name.split('.')[0]
        
        # Generate URLs for both standard and thumbnail images
        standard_image_url = f"https://{bucket}.s3.amazonaws.com/{decoded_key}"
        thumbnail_image_key = f"{RESIZED_FOLDER}{username}/{image_name}"
        thumbnail_image_url = f"https://{bucket}.s3.amazonaws.com/{thumbnail_image_key}"
        
        img_table.put_item(
            Item={
                'imageID': image_id,
                'username': username,
                'standardImageUrl': standard_image_url,
                'thumbnailImageUrl': thumbnail_image_url
            }
        )
        print(f"Inserted item with imageID: {image_id}")
        
        image = s3_client.get_object(Bucket=bucket, Key=decoded_key)
        tags = od.detect_image_bytes(image["Body"].read())
        grouped_tags = group_tags(tags)
        print(f"tags detected: {grouped_tags}")
        
        # Insert unique tags into tag_table and relationships into mid_table
        for tag, count in grouped_tags.items():
            try:
                # Insert tag into tag_table
                tag_table.put_item(
                    Item={
                        'tagName': tag
                    },
                    ConditionExpression='attribute_not_exists(tagName)'  # Ensures unique tags
                )
                print(f"Inserted tag: {tag}")
            except Exception as e:
                # Tag already exists, skip insertion
                print(f"Tag already exists in tag table: {tag}")
                
            # Insert relationship into mid_table
            mid_table.put_item(
                Item={
                    'imageID': image_id,
                    'tagName': tag,
                    'repetition': count
                }
            )
            print(f"Linked imageID: {image_id} with tag: {tag}")
        
        # Check for SNS notification
        user_subscription_arn = get_user_subscription(email)
        if user_subscription_arn:
            try:
                # Fetch user's subscription filter policy
                subscription = sns_client.get_subscription_attributes(
                    SubscriptionArn=user_subscription_arn
                )
                filter_policy = json.loads(subscription['Attributes']['FilterPolicy'])
                print(f"email: {email}")
                print(f"filter_policy: {filter_policy}")
                
                # Evaluate the filter policy
                should_notify = True
                for tag, conditions in filter_policy.items():
                    if tag == "email":
                        if email not in conditions:
                            should_notify = False
                            break
                    else:
                        if tag in grouped_tags:
                            for condition in conditions:
                                if "numeric" in condition:
                                    operator, value = condition["numeric"]
                                    if operator == ">=" and grouped_tags[tag] < value:
                                        should_notify = False
                                        break
                                # Add more operators if needed
                        else:
                            should_notify = False
                            break

                print(f"should_notify: {should_notify}")
                
                if should_notify:
                    # Send SNS notification
                    response = sns_client.publish(
                        TopicArn=SNS_ARN,
                        Message=f"New image uploaded with tags: {grouped_tags}, image url: {standard_image_url}",
                        Subject="New Image Notification",
                        MessageAttributes={
                            'email': {
                                'DataType': 'String',
                                'StringValue': email
                            }
                        }
                    )
                    print(f"SNS notification response: {response}")
                    print(f"Sent notification to {email}")
                print(f"end of logic.")
            except Exception as e:
                print(f"Failed to evaluate or send SNS notification: {e}")