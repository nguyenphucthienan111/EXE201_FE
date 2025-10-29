// src/config/quillConfig.js
import Quill from "quill";
// import BlotFormatter from "quill-blot-formatter";
// import ImageDropAndPaste from "quill-image-drop-and-paste";

// Đăng ký module cho Quill (enable resize + kéo-thả/dán ảnh)
// TẠMTHỜI TẮT: Quill.register("modules/blotFormatter", BlotFormatter);
// TẠMTHỜI TẮT: Quill.register("modules/imageDropAndPaste", ImageDropAndPaste);

// Helper: đổi nhanh chiều rộng ảnh đang được chọn
function setSelectedImageWidth(width = "50%") {
  const sel = document.getSelection();
  const img = sel?.anchorNode?.parentElement?.closest("img");
  if (!img) return;
  img.style.width = width;
  img.style.maxWidth = "100%";
  img.style.height = "auto";
}

export const editorModules = {
  toolbar: {
    container: [
      [{ font: [] }, { size: [] }],
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
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "list",
  "bullet",
  "align",
  "blockquote",
  "code-block",
  "link",
  "image",
];
