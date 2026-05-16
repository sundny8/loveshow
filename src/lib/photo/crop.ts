import sharp from 'sharp';

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
  imageW: number;
  imageH: number;
}

export interface CropResult {
  buffer: Buffer;
  /** 在原图中的裁剪区域 */
  extractLeft: number;
  extractTop: number;
  extractWidth: number;
  extractHeight: number;
  /** resize 后的目标尺寸 */
  outputWidth: number;
  outputHeight: number;
}

/**
 * 将原图中的 FaceBox 映射到裁剪并缩放后的图像坐标系。
 */
export function mapFaceToCropped(face: FaceBox, crop: CropResult): FaceBox {
  const sx = crop.outputWidth / crop.extractWidth;
  const sy = crop.outputHeight / crop.extractHeight;
  return {
    x: (face.x - crop.extractLeft) * sx,
    y: (face.y - crop.extractTop) * sy,
    w: face.w * sx,
    h: face.h * sy,
    imageW: crop.outputWidth,
    imageH: crop.outputHeight,
  };
}

/**
 * 根据人脸框和目标规格宽高比，计算以面部居中、面部占比约 0.4 的裁剪框。
 * 若 face 为 null，则按图像中心做 cover 裁剪。
 */
export async function smartCrop(
  buffer: Buffer,
  targetW: number,
  targetH: number,
  face: FaceBox | null
): Promise<CropResult> {
  const meta = await sharp(buffer).metadata();
  const imgW = meta.width ?? face?.imageW ?? targetW;
  const imgH = meta.height ?? face?.imageH ?? targetH;

  const targetRatio = targetW / targetH;

  let cropW: number;
  let cropH: number;
  let cropX: number;
  let cropY: number;

  if (face) {
    // 面部中心
    const cx = face.x + face.w / 2;
    const cy = face.y + face.h / 2;

    // 证件照紧凑裁剪：面部占 ~50%，仅保留头顶至部分肩膀
    const desiredH = Math.min(imgH, Math.max(face.h / 0.50, face.h * 2.0));
    const desiredW = desiredH * targetRatio;

    cropH = Math.min(desiredH, imgH);
    cropW = Math.min(desiredW, imgW);
    if (cropW > imgW) {
      cropW = imgW;
      cropH = cropW / targetRatio;
    }
    if (cropH > imgH) {
      cropH = imgH;
      cropW = cropH * targetRatio;
    }

    // 面部在裁剪框内：人脸中心置于 38% 处（紧凑证件照，头顶留白精简）
    cropX = Math.round(cx - cropW / 2);
    cropY = Math.round(cy - cropH * 0.38);
  } else {
    // 无人脸兜底：居中
    if (imgW / imgH > targetRatio) {
      cropH = imgH;
      cropW = Math.round(imgH * targetRatio);
    } else {
      cropW = imgW;
      cropH = Math.round(imgW / targetRatio);
    }
    cropX = Math.round((imgW - cropW) / 2);
    cropY = Math.round((imgH - cropH) / 2);
  }

  // 边界裁切
  cropX = Math.max(0, Math.min(cropX, imgW - cropW));
  cropY = Math.max(0, Math.min(cropY, imgH - cropH));
  cropW = Math.max(1, Math.round(cropW));
  cropH = Math.max(1, Math.round(cropH));

  const resultBuffer = await sharp(buffer)
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .resize(targetW, targetH, { fit: 'cover' })
    .toBuffer();

  return {
    buffer: resultBuffer,
    extractLeft: cropX,
    extractTop: cropY,
    extractWidth: cropW,
    extractHeight: cropH,
    outputWidth: targetW,
    outputHeight: targetH,
  };
}
