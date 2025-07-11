@@ .. @@
   const [uploadedFile, setUploadedFile] = useState<File | undefined>();
   const [selectedStyle, setSelectedStyle] = useState<{id: string; name: string; prompt: string} | undefined>();
   const [userZipCode, setUserZipCode] = useState<string>('');
+  const [roomType, setRoomType] = useState<string>('kitchen');
   const [emailSubmitted, setEmailSubmitted] = useState(false);
 
@@ .. @@
   const handleFileUpload = (file: File) => {
     setUploadedFile(file);
+    // Detect room type from file name or let user specify
+    // For now, we'll default to kitchen but this could be enhanced
     setShowStyleSelectionModal(true);
   };
@@ .. @@
       <EmailModal 
         isOpen={showEmailModal} 
         onClose={closeEmailModal}
         uploadedImage={aiResult?.generatedImage}
         beforeImage={aiResult?.originalImage}
+        selectedStyle={selectedStyle?.name}
+        roomType={roomType}
         onEmailSubmitted={handleEmailSubmitted}
       />