import json
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
img_table = dynamodb.Table("imagesTable")
mid_table = dynamodb.Table("imageTagMiddleTable")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    body = json.loads(event['body'])
    required_tags = body.get('tags', {})
    email = event['requestContext']['authorizer']['claims']['email']
    
    # Find imageIDs that meet the tag and username requirements
    image_ids = find_images_by_tags(required_tags)
    filtered_image_ids = filter_images_by_username(image_ids, email)
    
    # Retrieve thumbnail images from img_table
    thumbnail_images = []
    for image_id in filtered_image_ids:
        response_img = img_table.get_item(Key={'imageID': image_id})
        response_mid = fetch_mid_items(image_id)
        print(f"response_mid: {response_mid}")
        if 'Item' in response_img:
            thumbnail_images.append({
                "url": response_img['Item']['thumbnailImageUrl'],
                "tags": response_mid
            })
    
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        },
        'body': json.dumps(thumbnail_images, cls=DecimalEncoder)
    }

def find_images_by_tags(required_tags):
    image_ids = set()
    
    for tag, min_repetition in required_tags.items():
        response = mid_table.scan(
            FilterExpression=Attr('tagName').eq(tag) & Attr('repetition').gte(min_repetition)
        )
        tag_image_ids = {item['imageID'] for item in response['Items']}
        print(f"tag: {tag}, min_repetition: {min_repetition}, tag_image_ids {tag_image_ids}")
        
        # If at any point the intersection is empty, the result is empty
        if not tag_image_ids:
            image_ids = set()
            break
        
        if not image_ids:
            image_ids = tag_image_ids
        else:
            image_ids &= tag_image_ids
            
    print(f"final image_ids: {image_ids}")
    return image_ids

def filter_images_by_username(image_ids, email):
    filtered_image_ids = set()
    
    for image_id in image_ids:
        response = img_table.get_item(Key={'imageID': image_id})
        if 'Item' in response and response['Item'].get('username') == email:
            filtered_image_ids.add(image_id)
    
    print(f"filtered_image_ids: {filtered_image_ids}")
    return filtered_image_ids

def fetch_mid_items(image_id):
    response = mid_table.query(
        KeyConditionExpression=Key('imageID').eq(image_id)
    )
    return response['Items']