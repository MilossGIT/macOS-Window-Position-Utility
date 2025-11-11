{
  "targets": [
    {
      "target_name": "window_manager",
      "sources": [
        "src/native/window_manager.mm"
      ],
      "libraries": [
        "-framework Cocoa",
        "-framework CoreGraphics"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.12"
      }
    }
  ]
}