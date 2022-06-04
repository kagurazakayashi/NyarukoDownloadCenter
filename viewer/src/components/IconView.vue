<template>
  <el-icon><component :is="typeIcon(fileName)" /></el-icon>
</template>

<script lang="ts">
import { defineComponent } from "vue";
const extLib: (string | string[])[][] = [
  [
    [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "svg",
      "tif",
      "tiff",
      "jfif",
      "webp",
      "bmp",
      "arw",
      "raw",
    ],
    "图片文件",
    "Picture",
  ],
  [
    ["mp4", "mkv", "mov", "flv", "ape", "wmv", "avi"],
    "视频文件",
    "VideoCamera",
  ],
  [["mp3", "wav", "flac", "wma", "ape"], "音频文件", "Headset"],
  [["exe", "bat", "sh"], "可执行文件", "Setting"],
  [["txt", "md", "pdf", "doc", "docx"], "文字文档", "Document"],
  [["xls", "xlsx", "csv"], "电子表格", "List"],
  [["ppt", "pptx", "pps"], "幻灯片", "DataAnalysis"],
  [["zip", "rar", "7z", "xz", "gz"], "压缩包", "Box"],
  [["htm", "html"], "网页", "CollectionTag"],
  [["c", "h", "cs", "py", "go", "dart", "js", "sql"], "代码文件", "Expand"],
  [["json", "ini", "conf", "xml"], "配置文件", "SetUp"],
  [["psd", "ai"], "图形源文件", "PictureRounded"],
];
export default defineComponent({
  props: {
    fileName: String,
  },
  methods: {
    typeIcon(filename = "") {
      const fileNameUnit: string[] = filename.split(".");
      const fileNameUnitLen: number = fileNameUnit.length;
      const defaultIcon = "DocumentRemove";
      const extName: string =
        fileNameUnitLen > 1 ? fileNameUnit[fileNameUnitLen - 1] : defaultIcon;
      for (const extInfo of extLib) {
        const exts: string[] = extInfo[0] as string[];
        for (const ext of exts) {
          if (ext == extName) {
            const icon: string = extInfo[2] as string;
            return icon;
          }
        }
      }
      return defaultIcon;
    },
  },
});
</script>
