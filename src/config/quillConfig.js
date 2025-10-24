// src/config/quillConfig.js
export const editorModules = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
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
