import json
import base64
import boto3
import os
import uuid
import numpy as np
import cv2

# Define folder paths and S3 bucket name
STANDARD_FOLDER = "standard_images/"
RESIZED_FOLDER = 'resized_images/'
s3_client = boto3.client('s3')
S3_BUCKET = "fit5225-gp40-photos"
THUMBNAIL_WIDTH = 100

def lambda_handler(event, context):
    # Parse the incoming event data
    request_data = json.loads(event['body'])
    original_filename = request_data['name']
    _, file_extension = os.path.splitext(original_filename)
    image_base64 = request_data['file']
    username = event['requestContext']['authorizer']['claims']['email']
    print(f"email: {username}")
    
    # Process the image and generate S3 keys
    unique_id = uuid.uuid4().hex
    standard_image_key, resized_image_key = generate_s3_keys(username, file_extension, unique_id)
    
    # Decode and process the image
    image_data = decode_base64_image(image_base64)
    original_image = read_image_from_bytes(image_data)
    thumbnail_image = create_thumbnail(original_image, THUMBNAIL_WIDTH)
    
    # Encode images to bytes
    thumbnail_bytes = encode_image_to_bytes(thumbnail_image, file_extension)
    
    def get_mime_type(file_extension):
        """Return the correct MIME type for a given file extension."""
        mime_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            # Add more file types as needed
        }
        return mime_types.get(file_extension.lower(), 'application/octet-stream')

    # Usage in your lambda_handler
    content_type = get_mime_type(file_extension)
    
    # Upload images to S3
    upload_image_to_s3(S3_BUCKET, standard_image_key, image_data, content_type)
    upload_image_to_s3(S3_BUCKET, resized_image_key, thumbnail_bytes, content_type)
    print(f"standard_image_key: {standard_image_key}")
    print(f"resized_image_key: {resized_image_key}")
    
    # Return a successful response
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*"
        },
        'body': json.dumps("Image uploaded successfully")
    }

def generate_s3_keys(username, file_extension, unique_id):
    """Generate S3 object keys for the original and resized images."""
    standard_image_key = f"{STANDARD_FOLDER}{username}/{unique_id}{file_extension}"
    resized_image_key = f"{RESIZED_FOLDER}{username}/{unique_id}{file_extension}"
    return standard_image_key, resized_image_key

def decode_base64_image(image_base64):
    """Decode a base64 encoded image."""
    return base64.b64decode(image_base64)

def read_image_from_bytes(image_bytes):
    """Convert byte data to an OpenCV image."""
    np_image_array = np.asarray(bytearray(image_bytes), np.uint8)
    return cv2.imdecode(np_image_array, cv2.IMREAD_COLOR)

def create_thumbnail(image, width):
    """Resize the image to create a thumbnail."""
    height = int(image.shape[0] * (width / image.shape[1]))
    return cv2.resize(image, (width, height), interpolation=cv2.INTER_AREA)

def encode_image_to_bytes(image, file_extension):
    """Encode an image to bytes."""
    _, buffer = cv2.imencode(file_extension, image)
    return buffer.tobytes()

def upload_image_to_s3(bucket, key, image_data, content_type):
    """Upload an image to S3."""
    s3_client.put_object(
        Bucket=bucket, 
        Key=key, 
        Body=image_data, 
        ContentType=content_type, 
        ContentDisposition='inline',
        ACL='public-read'
    )
