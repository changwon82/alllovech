import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp",
  pdf: "application/pdf", hwp: "application/x-hwp",
  zip: "application/zip", rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

// R2에 파일 업로드 → 저장된 key 반환
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  fileName: string,
): Promise<void> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

// R2에서 파일 삭제 (썸네일도 함께 삭제)
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET!;

  // 원본 삭제
  const deleteOriginal = client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  );

  // 썸네일 삭제 (이미지 파일인 경우)
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const imageExts = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp"]);

  if (imageExts.has(ext)) {
    const parts = key.split("/");
    const fileName = parts.pop()!;
    const thumbKey = [...parts, "_thumb", fileName].join("/");

    await Promise.all([
      deleteOriginal,
      client.send(new DeleteObjectCommand({ Bucket: bucket, Key: thumbKey })).catch(() => {}),
    ]);
  } else {
    await deleteOriginal;
  }
}

export type R2Object = {
  key: string;
  size: number;
  lastModified: string;
};

/** R2 버킷에서 특정 prefix의 파일 목록 조회 */
export async function listR2Objects(
  prefix: string,
  continuationToken?: string,
): Promise<{ objects: R2Object[]; folders: string[]; nextToken?: string }> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET!;

  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      Delimiter: "/",
      MaxKeys: 100,
      ContinuationToken: continuationToken || undefined,
    }),
  );

  const objects: R2Object[] = (result.Contents || [])
    .filter((o) => o.Key && o.Key !== prefix)
    .map((o) => ({
      key: o.Key!,
      size: o.Size || 0,
      lastModified: o.LastModified?.toISOString() || "",
    }));

  // 첫 페이지: 폴더가 MaxKeys에 의해 잘릴 수 있으므로 모든 폴더를 수집
  const allFolders = new Set(
    (result.CommonPrefixes || []).map((p) => p.Prefix!).filter(Boolean),
  );

  if (!continuationToken && result.IsTruncated) {
    // 추가 페이지를 돌면서 폴더(CommonPrefixes)만 수집
    let token = result.NextContinuationToken;
    while (token) {
      const more = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix || undefined,
          Delimiter: "/",
          MaxKeys: 1000,
          ContinuationToken: token,
        }),
      );
      for (const p of more.CommonPrefixes || []) {
        if (p.Prefix) allFolders.add(p.Prefix);
      }
      token = more.IsTruncated ? more.NextContinuationToken : undefined;
    }
  }

  // _thumb 폴더를 마지막에 정렬
  const folders = Array.from(allFolders).sort((a, b) => {
    const aIsThumb = a.endsWith("_thumb/");
    const bIsThumb = b.endsWith("_thumb/");
    if (aIsThumb && !bIsThumb) return 1;
    if (!aIsThumb && bIsThumb) return -1;
    return a.localeCompare(b);
  });

  return {
    objects,
    folders,
    nextToken: result.IsTruncated ? result.NextContinuationToken : undefined,
  };
}

/** R2 버킷에서 특정 prefix의 모든 파일을 재귀적으로 조회 (delimiter 없음) */
export async function listAllR2Objects(prefix: string): Promise<R2Object[]> {
  const all: R2Object[] = [];
  let token: string | undefined;

  do {
    const result = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET!,
        Prefix: prefix || undefined,
        MaxKeys: 1000,
        ContinuationToken: token,
      }),
    );

    for (const o of result.Contents || []) {
      if (o.Key) {
        all.push({
          key: o.Key,
          size: o.Size || 0,
          lastModified: o.LastModified?.toISOString() || "",
        });
      }
    }

    token = result.IsTruncated ? result.NextContinuationToken : undefined;
  } while (token);

  return all;
}

/** R2에서 파일 이동 (복사 + 삭제) */
export async function moveR2Object(srcKey: string, destKey: string): Promise<void> {
  const bucket = process.env.R2_BUCKET!;
  const client = getR2Client();

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${srcKey}`,
      Key: destKey,
    }),
  );

  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: srcKey }),
  );
}

const R2_PUBLIC = "https://pub-8b16770935a84226a2ce21554c7466de.r2.dev";

/** content HTML에서 R2 이미지 key 목록 추출 */
export function extractContentImageKeys(content: string | null): string[] {
  if (!content) return [];

  const regex = /src=["']+([^"']+)["']+/g;
  const keys: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const url = match[1];
    if (!url.startsWith(R2_PUBLIC)) continue;
    const key = url.slice(R2_PUBLIC.length + 1);
    if (key) keys.push(key);
  }
  return keys;
}

/** content HTML에서 R2 이미지 URL을 추출하여 R2에서 삭제 */
export async function deleteContentImages(content: string | null): Promise<void> {
  const keys = extractContentImageKeys(content);
  if (keys.length > 0) {
    await Promise.all(keys.map((k) => deleteFromR2(k)));
  }
}

/** 구 content vs 신 content를 비교하여, 빠진 인라인 이미지만 R2에서 삭제 */
export async function deleteRemovedContentImages(
  oldContent: string | null,
  newContent: string | null,
): Promise<void> {
  const oldKeys = extractContentImageKeys(oldContent);
  if (oldKeys.length === 0) return;

  const newKeys = new Set(extractContentImageKeys(newContent));
  const removed = oldKeys.filter((k) => !newKeys.has(k));

  if (removed.length > 0) {
    await Promise.all(removed.map((k) => deleteFromR2(k)));
  }
}
