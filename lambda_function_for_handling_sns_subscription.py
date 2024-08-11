import json
import boto3

SNS_ARN = "arn:aws:sns:us-east-1:703013977731:pixtag-sns"
sns_client = boto3.client('sns')

def get_user_subscription(email):
    subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=SNS_ARN)
    for subscription in subscriptions['Subscriptions']:
        if subscription['Endpoint'] == email:
            return subscription['SubscriptionArn'], subscription['SubscriptionArn'] == 'PendingConfirmation'
    return None, False

def lambda_handler(event, context):
    body = json.loads(event['body'])
    tags = body['tags']
    email = event['requestContext']['authorizer']['claims']['email']

    # Check if the user already has a subscription
    existing_subscription_arn, is_pending = get_user_subscription(email)
    
    # If the subscription is pending confirmation, return a response indicating this status
    if is_pending:
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({
                'message': 'Subscription request is pending confirmation. Please check your email to confirm the previous subscription first.',
                'subscriptionArn': 'PendingConfirmation'
            })
        }

    # If the user has an existing subscription and it's not pending confirmation, unsubscribe first
    if existing_subscription_arn:
        print(f"Existing subscription ARN for {email}: {existing_subscription_arn}")
        if existing_subscription_arn.startswith('arn:aws:sns:'):
            sns_client.unsubscribe(SubscriptionArn=existing_subscription_arn)
            print(f"Unsubscribed existing subscription for {email}")
        else:
            print(f"Invalid Subscription ARN: {existing_subscription_arn}")

    # Constructing the filter policy
    filter_policy = {tag: [{'numeric': ['>=', count]}] for tag, count in tags.items()}
    filter_policy['email'] = [email]
    print(filter_policy)

    response = sns_client.subscribe(
        TopicArn=SNS_ARN,
        Protocol='email',
        Endpoint=email,
        Attributes={
            'FilterPolicy': json.dumps(filter_policy)
        }
    )
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        },
        'body': json.dumps({
            'message': 'Subscription request successful' + response['SubscriptionArn'],
            'subscriptionArn': response['SubscriptionArn'],
            'filter_policy': filter_policy
        })
    }
