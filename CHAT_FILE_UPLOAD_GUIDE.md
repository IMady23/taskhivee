# Chat File Upload Feature - User Guide

## ✅ Feature Now Live!

The file upload feature in Team Chat is now fully functional. You can upload and share images and documents with your team in real-time.

## How to Upload Files

1. **Navigate to Team Chat**
   - Go to `/member/chat` or `/leader/chat`
   - You'll see the chat interface with your team members

2. **Click the Paperclip Icon**
   - Located in the message input area (bottom right)
   - Next to the emoji button

3. **Select Your File**
   - Choose an image or document from your computer
   - Max file size: 5MB
   - Supported formats: Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX, TXT)

4. **Wait for Upload**
   - You'll see a loading toast: "Uploading {filename}..."
   - Upload typically takes 1-5 seconds depending on file size
   - Success message appears when complete

5. **View in Chat**
   - **Images**: Display inline with preview
   - **Documents**: Show as download link with file icon

## Supported File Types

### Images (Display Inline)
- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)

### Documents (Download Link)
- PDF (.pdf)
- Word Documents (.doc, .docx)
- Text Files (.txt)

## Features

### For Images
- ✅ Inline preview in chat
- ✅ Click to open full size in new tab
- ✅ Maintains aspect ratio
- ✅ Rounded corners for elite design
- ✅ Hover effect

### For Documents
- ✅ File icon with name
- ✅ "Click to download" label
- ✅ Opens in new tab
- ✅ Secure download URL

### General
- ✅ Real-time upload progress
- ✅ Toast notifications (loading, success, error)
- ✅ File size validation (max 5MB)
- ✅ Automatic message creation
- ✅ Sender info (name, photo, timestamp)
- ✅ Works for all team members

## File Storage

Files are securely stored in Firebase Storage with this structure:
```
chat_uploads/
  └── {teamId}/
      └── {messageId}/
          └── {filename}
```

Each file gets a unique path to prevent overwrites and maintain organization.

## Limitations

- **Max file size**: 5MB per file
- **No video support**: Videos are not currently supported
- **No audio support**: Audio files are not currently supported
- **Single file**: Upload one file at a time

## Troubleshooting

### "File size must be less than 5MB"
- Your file is too large
- Compress the image or document before uploading
- For images, use online tools like TinyPNG or Squoosh

### "Failed to upload file"
- Check your internet connection
- Verify Firebase Storage is configured correctly
- Check browser console for detailed error
- Try refreshing the page and uploading again

### File doesn't appear in chat
- Wait a few seconds for real-time sync
- Refresh the page
- Check if the upload toast showed success

### Image not displaying
- Verify the file is actually an image (PNG, JPG, GIF)
- Check if the image URL is accessible
- Try opening the image in a new tab

## Security

- Files are stored in Firebase Storage with secure URLs
- Download URLs are time-limited by Firebase
- Only team members can access chat files
- File validation prevents malicious uploads

## Tips

1. **Compress images** before uploading to save space and upload faster
2. **Use descriptive filenames** so team members know what the file is
3. **Upload screenshots** for bug reports or design feedback
4. **Share documents** like PDFs for team resources
5. **Click images** to view them full-screen

## Future Enhancements

Coming soon:
- Multiple file upload
- Drag and drop support
- File preview before sending
- Video support
- Audio support
- File search in chat history
- Download all files button

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify your Firebase configuration
3. Ensure Firebase Storage is enabled in your project
4. Check Firebase Storage security rules
5. Contact support with error details

---

**Enjoy sharing files with your team! 🚀**
