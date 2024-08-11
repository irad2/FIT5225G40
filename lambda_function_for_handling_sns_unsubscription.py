import json
import boto3

SNS_ARN = "arn:aws:sns:us-east-1:703013977731:pixtag-sns"
sns_client = boto3.client('sns')

def get_user_subscription(email):
    subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=SNS_ARN)
    for subscription in subscriptions['Subscriptions']:
        if subscription['Endpoint'] == email:
            return subscription['SubscriptionArn']
    return None

def lambda_handler(event, context):
    email = event['requestContext']['authorizer']['claims']['email']

    # Check if the user has a subscription
    existing_subscription_arn = get_user_subscription(email)
    
    # If the user has an existing subscription, unsubscribe
    if existing_subscription_arn:
        sns_client.unsubscribe(SubscriptionArn=existing_subscription_arn)
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({
                'message': f'Successfully unsubscribed {email}'
            })
        }
    else:
        return {
            'statusCode': 404,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({
                'message': f'No subscription found for {email}'
            })
        }
