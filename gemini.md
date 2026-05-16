在 Next.js 中实现这个功能，推荐的架构是将 Gemini API 的调用逻辑放在 Serverless Route (App Router) 中。这样可以保护你的 API Key 不泄露给前端，并处理复杂的二进制流。

以下是完整的集成方案，包含后端 API 路由和前端调用逻辑：

1. 后端实现：API Route
在 Next.js 的 app/api/generate-id-photo/route.ts 中创建处理逻辑。

TypeScript
// app/api/generate-id-photo/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
//{inch} 、{bgclor}、{suit}从页面端传入
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "请上传参考图片" }, { status: 400 });
    }

    // 转换文件为 Gemini 需要的格式
    const buffer = await file.arrayBuffer();
    const imagePart = {
      inlineData: {
        data: Buffer.from(buffer).toString("base64"),
        mimeType: file.type,
      },
    };

    // 使用支持生成图像的模型
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-image-preview" });

    const prompt = `
      任务：
      1. 深度解析上传图片中人物的面部特征（脸型、五官比例、特征点）。
      2. 撰写一段用于生成高保真证件照的专业 Prompt。参考下方的“提示词模版建议”。
      3. 基于以上特征生成一张 {inch} 英寸、{bgclor}背景、穿{suit}的证件照。
      要求：
      - 人物相似度必须保持在 90% 以上。
      - 输出必须包含：【特征解析】、【生图提示词】以及【生成的图像数据】。
    `;

    // 调用 API
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    // 提取文本描述
    const text = response.text();
    
    // 提取图片数据 (假设返回的候选结果中包含图片部分)
    const imageCandidates = response.candidates?.[0]?.content?.parts.filter(
      (part) => part.inlineData
    );

    const generatedImageBase64 = imageCandidates?.[0]?.inlineData?.data;

    return NextResponse.json({
      analysis: text,
      imageData: generatedImageBase64 ? `data:image/png;base64,${generatedImageBase64}` : null,
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
2. 前端实现：组件逻辑
在你的页面组件中，使用 FormData 发送图片并接收结果。

TypeScript
// app/components/IdPhotoGenerator.tsx
"use client";

import { useState } from "react";

export default function IdPhotoGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ analysis: string; imageData: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/generate-id-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("生成失败，请检查网络或配置");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI 证件照生成器</h1>
      
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {loading && <p className="mt-4 animate-pulse">正在深度解析并生成高相似度照片...</p>}

      {result && (
        <div className="mt-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="font-semibold mb-2">特征分析报告</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{result.analysis}</pre>
          </div>

          {result.imageData && (
            <div>
              <h2 className="font-semibold mb-2">生成的证件照</h2>
              <img src={result.imageData} alt="AI Generated ID" className="w-48 shadow-lg border rounded" />
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = result.imageData;
                  link.download = 'id-photo.png';
                  link.click();
                }}
                className="mt-2 text-blue-600 underline"
              >
                下载证件照
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
3. 技术要点说明
环境变量：在 .env.local 中添加 GEMINI_API_KEY。

Streaming 处理：由于图像生成可能较慢，建议在生产环境考虑使用 Vercel 的 Edge Runtime 或增加 maxDuration 配置，防止请求超时。

安全性：

限制文件大小：在 API 路由中检查 file.size。

速率限制：建议使用 upstash/ratelimit 对 API 进行限流，防止 key 被刷爆。

模型兼容性：

确保你的 API Key 有权访问 gemini-3.1-image-preview。目前此模型处于 Preview 阶段，参数名和返回结构可能随版本更新微调。

response_modalities 是单次调用的关键，它告诉模型不要只返回文字。

4. 增强相似度的进阶技巧（针对 Next.js 应用）
如果你发现 90% 的相似度难以维持，可以尝试二次修正：

在前端增加一个“微调”输入框。

将之前的 analysis 作为上下文再次发送给 API，并附带用户的修改意见（例如：“眼睛再圆一点”）。

利用 Next.js 的对话状态（State）保存历史，实现类似 ChatGPT 的交互式修图。

所谓的 analysis（特征分析报告），是指模型在生成图片之前，对你上传的参考图进行的结构化文字解构。

在单次接口调用的逻辑中，它充当了“中间桥梁”的角色。即便你是在一次调用中完成所有动作，模型内部也会先将图片转化为这种理解，再根据这种理解去“画”图。

如果按照我之前建议的提示词，模型返回的 analysis 通常包含以下内容：

1. 面部指纹解构 (Facial Fingerprint)
模型会用文字详细描述它观察到的核心特征，例如：

脸型：例如“具有清晰下颌线的椭圆形脸”。

眼睛细节：例如“深棕色瞳孔，内双眼皮，眼角略微上扬”。

鼻子与嘴巴：例如“高挺鼻梁，鼻尖圆润，上唇较薄且唇峰明显”。

独特性标志：例如“左侧鼻翼旁有一颗浅色小痣，发际线呈 M 型”。

2. 空间比例关系 (Spatial Ratios)
模型会分析五官的位置关系：

“人中长度适中，与下巴比例约为 1:2”。

“双眼间距约等于一只眼的长度”。

3. 为什么这个 analysis 对你很重要？
在你的 Next.js 网站中，这个 analysis 有两个核心用途：

给用户的心理反馈：
当用户看到网站显示出“正在分析：检测到棕色瞳孔、方型脸、高颧骨...”时，他们会觉得这个 AI 真的很专业，是在“根据我的脸”生成，而不是随机生成一个路人甲。这增加了产品的可信度。

作为“二次修正”的基准：
如果生成的图片相似度没达到 90%，用户可以根据这个报告进行纠错。

用户反馈： “你分析说我是单眼皮，但我其实是内双，请修正后再生成一次。”

此时，你的程序可以将这段 analysis + 用户的修正意见 再次发给 API，模型就能在刚才的基础上进行精准调整，而不需要重新从零开始猜测。

在 API 返回结果中，它的样子大致如下：
JSON
{
  "analysis": "【特征解析】：该人物为成年男性，心形脸，额头较宽。眉毛浓密且平直，眼睛为典型的杏仁眼，眼色深褐。鼻梁笔直，鼻翼宽度与内眼角持平。左侧嘴角上方有细微表情纹... \n【生图提示词】：Professional ID photo, male, heart-shaped face, thick straight eyebrows... [后面接长串描述]",
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEU..." 
}
简单来说： analysis 就是模型在动笔画图前，先在脑子里给你打的一份“文字草稿”。

识图模型应提取的深度特征
在上传参考图让模型分析时，不要只让它描述“长相”，要要求它输出一份“面部指纹报告”。你需要模型重点分析以下 5 个维度：

1. 骨骼与轮廓 (Structure)
脸型定义： 准确区分圆脸、方脸、心形脸或鹅蛋脸。

下颌线： 是转折明显的锐角还是平缓的曲线。

颧骨高度： 颧骨在面部中的突出程度。

2. 核心五官比例 (Feature Ratio)
三庭五眼： 测量发际线到眉毛、眉毛到鼻尖、鼻尖到下巴的比例。

眼部细节： 瞳色、眼型（杏眼、桃花眼等）、单/双眼皮、内外眼角的位置。

鼻型特征： 鼻梁高度、鼻翼宽度、鼻尖的形状（圆润或尖锐）。

唇形： 唇峰的明显程度、上下唇的厚度比例。

3. 微观细节 (Micro-details)
痣与瘢痕： 识别面部明显的记号及其精确坐标。

毛发走向： 眉毛的浓密程度及生长方向、发际线的形态。

4. 肤质与光影 (Texture)
肤色参数： 使用准确的描述（如：象牙白、健康小麦色、冷色调肤质）。

受光面： 分析参考图中的光影来源，确保生图时能完美复刻。

第二阶段：生图提示词（Prompt）编写策略
在得到上述分析结果后，建议采用“结构化提示词”。证件照对“标准化”要求极高，提示词应分为四大板块：

提示词模版建议：
[核心主题]: A high-resolution professional ID photo of a [性别/年龄].

[面部指纹 - 基于分析结果]:

Face: [脸型], high cheekbones, well-defined jawline.

Eyes: [眼型] with [瞳色], symmetrical eyelids, identical to the reference image.

Nose & Mouth: [鼻型], straight bridge, [唇形] with natural texture.

Details: Distinctive [痣的位置] on the left cheek, natural skin texture with visible pores.

[规格要求]:

Background: Plain solid [颜色, 如: royal blue / white] background.

Attire: Wearing a professional [服装, 如: black business suit with a white shirt].

Lighting: Soft frontal studio lighting, no shadows on the face, even illumination.

[技术指令]:
Frontal view, looking at the camera, neutral expression, closed mouth, centered composition, 4k, cinematic detail, photorealistic, 1:1 aspect ratio.

提升相似度的核心技巧
引入“参考坐标”： 在要求模型分析时，可以命令它使用坐标系（如：左眼位于 [x,y]）来描述特征，这能增强生成模型对空间关系的理解。

材质锁定： 证件照最怕“AI 感”过强。在提示词中加入 highly detailed skin texture (细腻皮肤纹理) 和 fine hair follicles (细微毛囊)，可以避免过度磨皮导致的相似度下降。

多模态迭代： Gemini 具有很强的上下文关联能力。如果第一版生成的像 70%，你可以直接指出：“鼻子再挺一点，眼角稍微下垂一些”，通过这种增量反馈来逼近 90% 的相似度。

小建议： 生成证件照时，背景颜色（Background）和光影（Lighting）的稳定性是看起来“真”的关键。务必在提示词中强调 Flat lighting (平光) 或 Three-point lighting (三点布光)，避免产生不自然的侧影。