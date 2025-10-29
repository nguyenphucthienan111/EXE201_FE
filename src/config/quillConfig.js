// src/config/quillConfig.js
import Quill from "quill";
// import BlotFormatter from "quill-blot-formatter";
// import ImageDropAndPaste from "quill-image-drop-and-paste";

/* ---------- Font whitelist: v2 (style) ưu tiên, fallback v1 (formats) ---------- */
let Font;
try {
  // Quill v2
  Font = Quill.import("attributors/style/font");
} catch {
  // Quill v1 fallback
  Font = Quill.import("formats/font");
}

/** Dùng chính tên font-family (v2 sẽ set style inline) */
export const FONT_WHITELIST = [
  "sans-serif",
  "serif",
  "monospace",
  "Montserrat",        // <- tên đúng của font
  "Times New Roman",   // <- có khoảng trắng OK với style attributor
];

Font.whitelist = FONT_WHITELIST;
Quill.register(Font, true);

/* ---------- Modules ảnh ---------- */
// DISABLED: Quill plugins not compatible with Vite production build
// Quill.register("modules/blotFormatter", BlotFormatter);
// Quill.register("modules/imageDropAndPaste", ImageDropAndPaste);

/* Helper: đổi nhanh chiều rộng ảnh đang chọn */
function setSelectedImageWidth(width = "50%") {
  const img = document.getSelection()?.anchorNode?.parentElement?.closest("img");
  if (!img) return;
  img.style.width = width;
  img.style.maxWidth = "100%";
  img.style.height = "auto";
}

export const editorModules = {
  toolbar: {
    container: [
      [{ font: FONT_WHITELIST }],   // dùng đúng whitelist ở trên
      [{ size: [] }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }], // chọn align khi đang chọn ảnh -> sẽ áp vào ảnh
      ["blockquote", "code-block"],
      ["link", "image"], // nút chèn ảnh
      ["image-s", "image-m", "image-l"], // preset S/M/L cho ảnh (custom)
      ["clean"],
    ],
    handlers: {
      "image-s": () => setSelectedImageWidth("33%"),
      "image-m": () => setSelectedImageWidth("50%"),
      "image-l": () => setSelectedImageWidth("100%"),
    },
  },
  // TẠMTHỜI TẮT để fix lỗi build
  // blotFormatter: {
  //   // có khung resize khi click vào ảnh
  // },
  // imageDropAndPaste: {
  //   // cho phép kéo-thả / Ctrl+V ảnh trực tiếp
  // },
};

export const editorFormats = [
  "header","font","size","bold","italic","underline","strike",
  "color","background","script","list","bullet","align",
  "blockquote","code-block","link","image",
];
