import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 要处理的文件列表
const files = [
  'src/pages/analysis/index.tsx',
  'src/pages/analysis/PredictionPanel.tsx',
  'src/pages/analysis/ClusterAnalysisPanel.tsx',
  'src/pages/analysis/SourceAttributionPanel.tsx',
  'src/pages/analysis/TrendAnalysisPanel.tsx',
  'src/pages/analysis/CorrelationAnalysisPanel.tsx',
];

// 中文引号替换为英文引号
function replaceChineseQuotes(content) {
  // 替换中文引号为英文引号
  let result = content.replace(/"/g, '"').replace(/"/g, '"');
  // 替换中文单引号为英文单引号
  result = result.replace(/'/g, "'").replace(/'/g, "'");
  return result;
}

// 处理每个文件
for (const filePath of files) {
  const absolutePath = path.resolve(__dirname, filePath);
  
  try {
    // 读取文件内容
    const content = fs.readFileSync(absolutePath, 'utf8');
    
    // 替换中文引号
    const processedContent = replaceChineseQuotes(content);
    
    // 写回文件
    fs.writeFileSync(absolutePath, processedContent, 'utf8');
    
    console.log(`Successfully processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

console.log('All files processed.'); 