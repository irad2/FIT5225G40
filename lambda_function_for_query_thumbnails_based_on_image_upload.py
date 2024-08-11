import json
import base64
import boto3
import object_detection_v2 as od
from decimal import Decimal
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')
mid_table = dynamodb.Table("imageTagMiddleTable")
img_table = dynamodb.Table("imagesTable")

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    email = event['requestContext']['authorizer']['claims']['email']
    # Parse the incoming event data
    request_data = json.loads(event['body'])
    image_base64 = request_data['file']
    
    # Decode and process the image
    image_data = decode_base64_image(image_base64)
    print("Decoded image, size:", len(image_data))
    print("Type of image_data:", type(image_data))
    print("First 10 bytes of image_data:", image_data[:10])
    
    tags = od.detect_image_bytes(image_data)
    print("Detected tags:", tags)
    
    grouped_tags = group_tags(tags)
    image_ids = find_images_by_tags(grouped_tags)
    filtered_image_ids = filter_images_by_username(image_ids, email)
    
    if not filtered_image_ids:
        return {
            'statusCode': 404,
            'headers': {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            },
            'body': json.dumps({'message': 'No images found matching the criteria'})
        }
    
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

def fetch_mid_items(image_id):
    response = mid_table.query(
        KeyConditionExpression=Key('imageID').eq(image_id)
    )
    return response['Items']
    
def filter_images_by_username(image_ids, email):
    filtered_image_ids = set()
    
    for image_id in image_ids:
        response = img_table.get_item(Key={'imageID': image_id})
        if 'Item' in response and response['Item'].get('username') == email:
            filtered_image_ids.add(image_id)
    
    print(f"filtered_image_ids: {filtered_image_ids}")
    return filtered_image_ids
    

def decode_base64_image(image_base64):
    """Decode a base64 encoded image."""
    return base64.b64decode(image_base64)

def group_tags(tags):
    tag_counts = {}
    for tag in tags:
        if tag in tag_counts:
            tag_counts[tag] += 1
        else:
            tag_counts[tag] = 1
    return tag_counts

def find_images_by_tags(required_tags):
    image_ids = set()
    
    for tag, min_repetition in required_tags.items():
        response = mid_table.scan(
            FilterExpression=Attr('tagName').eq(tag) & Attr('repetition').gte(min_repetition)
        )
        tag_image_ids = {item['imageID'] for item in response['Items']}
        
        if not image_ids:
            image_ids = tag_image_ids
        else:
            image_ids &= tag_image_ids
    
    return image_ids