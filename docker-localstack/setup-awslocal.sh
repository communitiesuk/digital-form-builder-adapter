#!/bin/bash

export AWS_REGION=eu-west-2

# Create the bucket using awslocal
if awslocal s3 ls | grep -q fsd-bucket; then
  echo "Bucket already exists!"
else
  awslocal s3api \
  create-bucket --bucket fsd-bucket \
  --create-bucket-configuration LocationConstraint=$AWS_REGION \
  --region $AWS_REGION
  echo "Created Bucket fsd-bucket!"
  awslocal s3api \
  put-bucket-cors --bucket fsd-bucket \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"]
      }
    ]
  }'
  echo "Created CORS rule!"
fi
