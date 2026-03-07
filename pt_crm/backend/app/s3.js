import { S3Client, PutObjectCommand, HeadObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import axios from 'axios';

const s3Client = new S3Client({
    region: "us-east-1",
    endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin"
    },
    forcePathStyle: true
});

const AVATAR_BUCKET = "avatars";
const PROFILE_BUCKET = "profiles";
const OSINT_BUCKET = "osint";
const REPORTS_BUCKET = "reports"; 
const PUBLIC_ENDPOINT = process.env.PUBLIC_S3_ENDPOINT || "http://localhost:9000";

async function ensureBucket(bucketName) {
    try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (e) {
        try {
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`[S3] Bucket '${bucketName}' created.`);
            
            const policy = {
                Version: "2012-10-17",
                Statement: [{
                    Sid: "PublicRead",
                    Effect: "Allow",
                    Principal: "*",
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }]
            };
            await s3Client.send(new PutBucketPolicyCommand({
                Bucket: bucketName,
                Policy: JSON.stringify(policy)
            }));
        } catch (createErr) {
            console.error(`[S3] Error creating bucket ${bucketName}:`, createErr.message);
        }
    }
}

export async function initS3() {
    await ensureBucket(AVATAR_BUCKET);
    await ensureBucket(PROFILE_BUCKET);
    await ensureBucket(OSINT_BUCKET);
    await ensureBucket(REPORTS_BUCKET);
}

export async function processAvatar(imageUrl, username) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('/')) imageUrl = `https://hackerone.com${imageUrl}`;

    const filename = `${username}.jpg`;
    const s3Url = `${PUBLIC_ENDPOINT}/${AVATAR_BUCKET}/${filename}`;

    try {
        await s3Client.send(new HeadObjectCommand({ Bucket: AVATAR_BUCKET, Key: filename }));
        return s3Url;
    } catch (e) {}

    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        await s3Client.send(new PutObjectCommand({
            Bucket: AVATAR_BUCKET,
            Key: filename,
            Body: response.data,
            ContentType: response.headers['content-type']
        }));
        return s3Url;
    } catch (error) {
        return imageUrl;
    }
}

export async function saveJson(bucket, filename, data) {
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: filename,
            Body: JSON.stringify(data, null, 2),
            ContentType: "application/json"
        }));
    } catch (error) {
        console.error(`[S3] Failed to save JSON to ${bucket}:`, error.message);
    }
}

export async function getJson(bucket, filename) {
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: filename
        }));
        const str = await response.Body.transformToString();
        return JSON.parse(str);
    } catch (e) {
        return null;
    }
}

export { PROFILE_BUCKET, OSINT_BUCKET, REPORTS_BUCKET };
