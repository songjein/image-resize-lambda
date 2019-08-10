# image-resize-lambda 
aws lambda용 이미지 리사이즈 서버 코드 (serverless)

## 접근 주소 형식
- http://API?url=이미지주소&width=너비&height=높이
- 예시: https://abcde.execute-api.ap-northeast-2.amazonaws.com/latest?url=[s3이미지주소.jpeg]&size=100x0

## IAM 유저 생성 후 ~/.aws/credentials 작성
```
[claudia]
aws_access_key_id = '' 
aws_secret_access_key = '' 
```
- ~/.bashrc에 export AWS_PROFILE=claudia 추가
