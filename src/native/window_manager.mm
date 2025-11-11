#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>
#include <node.h>
#include <v8.h>

using v8::Array;
using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

// Function to get all visible windows
void GetAllWindows(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    Local<Array> windows = Array::New(isolate);

    // Get list of all windows
    CFArrayRef windowList = CGWindowListCopyWindowInfo(kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements, kCGNullWindowID);

    if (windowList) {
        CFIndex count = CFArrayGetCount(windowList);
        int windowIndex = 0;

        for (CFIndex i = 0; i < count; i++) {
            CFDictionaryRef windowInfo = (CFDictionaryRef)CFArrayGetValueAtIndex(windowList, i);

            // Get window layer (skip windows that are not normal application windows)
            CFNumberRef layerRef = (CFNumberRef)CFDictionaryGetValue(windowInfo, kCGWindowLayer);
            int layer = 0;
            if (layerRef) {
                CFNumberGetValue(layerRef, kCFNumberIntType, &layer);
            }

            // Only process normal application windows (layer 0)
            if (layer == 0) {
                // Get window bounds
                CFDictionaryRef boundsRef = (CFDictionaryRef)CFDictionaryGetValue(windowInfo, kCGWindowBounds);
                if (boundsRef) {
                    CGRect bounds;
                    if (CGRectMakeWithDictionaryRepresentation(boundsRef, &bounds)) {
                        // Get window owner name
                        CFStringRef ownerName = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowOwnerName);
                        // Get window name
                        CFStringRef windowName = (CFStringRef)CFDictionaryGetValue(windowInfo, kCGWindowName);

                        if (ownerName) {
                            Local<Object> windowObj = Object::New(isolate);

                            // Convert CFString to C string
                            const char* ownerCStr = CFStringGetCStringPtr(ownerName, kCFStringEncodingUTF8);
                            const char* windowCStr = windowName ? CFStringGetCStringPtr(windowName, kCFStringEncodingUTF8) : "";

                            if (!ownerCStr) {
                                CFIndex length = CFStringGetLength(ownerName);
                                CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                                char* buffer = new char[maxSize];
                                if (CFStringGetCString(ownerName, buffer, maxSize, kCFStringEncodingUTF8)) {
                                    ownerCStr = buffer;
                                }
                            }

                            if (!windowCStr && windowName) {
                                CFIndex length = CFStringGetLength(windowName);
                                CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
                                char* buffer = new char[maxSize];
                                if (CFStringGetCString(windowName, buffer, maxSize, kCFStringEncodingUTF8)) {
                                    windowCStr = buffer;
                                }
                            }

                            windowObj->Set(context, String::NewFromUtf8(isolate, "app").ToLocalChecked(),
                                         String::NewFromUtf8(isolate, ownerCStr ? ownerCStr : "").ToLocalChecked());
                            windowObj->Set(context, String::NewFromUtf8(isolate, "title").ToLocalChecked(),
                                         String::NewFromUtf8(isolate, windowCStr ? windowCStr : "").ToLocalChecked());
                            windowObj->Set(context, String::NewFromUtf8(isolate, "x").ToLocalChecked(),
                                         Number::New(isolate, bounds.origin.x));
                            windowObj->Set(context, String::NewFromUtf8(isolate, "y").ToLocalChecked(),
                                         Number::New(isolate, bounds.origin.y));
                            windowObj->Set(context, String::NewFromUtf8(isolate, "width").ToLocalChecked(),
                                         Number::New(isolate, bounds.size.width));
                            windowObj->Set(context, String::NewFromUtf8(isolate, "height").ToLocalChecked(),
                                         Number::New(isolate, bounds.size.height));

                            windows->Set(context, windowIndex++, windowObj);
                        }
                    }
                }
            }
        }

        CFRelease(windowList);
    }

    args.GetReturnValue().Set(windows);
}

// Function to restore windows (simplified - actual implementation would need more work)
void RestoreWindows(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsArray()) {
        isolate->ThrowException(v8::Exception::TypeError(
            String::NewFromUtf8(isolate, "Expected array of window configurations").ToLocalChecked()));
        return;
    }

    Local<Array> windowsArray = Local<Array>::Cast(args[0]);
    Local<Context> context = isolate->GetCurrentContext();

    // Note: This is a simplified version. A full implementation would require
    // accessibility permissions and more complex window manipulation APIs

    // For now, we'll return success but note that full implementation
    // requires additional macOS APIs and permissions

    args.GetReturnValue().Set(String::NewFromUtf8(isolate, "Restore function called - full implementation requires accessibility permissions").ToLocalChecked());
}

// Initialize the addon
void Initialize(Local<Object> exports) {
    NODE_SET_METHOD(exports, "getAllWindows", GetAllWindows);
    NODE_SET_METHOD(exports, "restoreWindows", RestoreWindows);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)