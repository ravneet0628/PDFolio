// Comprehensive file processing utility with edge case handling

export function analyzeFileUpload(files, acceptedTypes, existingFiles = [], options = {}) {
  const {
    allowDuplicates = false,
    maxFiles = Infinity,
    maxFileSize = Infinity, // in bytes
    singleFileMode = false
  } = options;

  const results = {
    validFiles: [],
    invalidFiles: [],
    duplicateFiles: [],
    oversizedFiles: [],
    totalFiles: files.length,
    errors: [],
    warnings: [],
    info: []
  };

  // Convert accepted types to array if string
  const acceptedTypesArray = Array.isArray(acceptedTypes) 
    ? acceptedTypes 
    : acceptedTypes.split(',').map(type => type.trim());

  files.forEach(file => {
    // Check file type
    const isValidType = acceptedTypesArray.some(type => {
      if (type === 'application/pdf') {
        return file.type === 'application/pdf';
      }
      if (type.startsWith('image/')) {
        // Handle specific image types for JPG to PDF
        if (type === 'image/jpeg,image/png') {
          return file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
        }
        return file.type.startsWith('image/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      results.invalidFiles.push(file);
      return;
    }

    // Check file size
    if (file.size > maxFileSize) {
      results.oversizedFiles.push(file);
      return;
    }

    // Check for duplicates
    const isDuplicate = existingFiles.some(existingFile => 
      existingFile.name === file.name && existingFile.size === file.size
    );

    if (isDuplicate && !allowDuplicates) {
      results.duplicateFiles.push(file);
      return;
    }

    // Check max files limit
    if (results.validFiles.length >= maxFiles) {
      results.errors.push(`Maximum of ${maxFiles} files allowed`);
      return;
    }

    results.validFiles.push(file);
  });

  // Generate messages based on results
  generateResultMessages(results, singleFileMode);

  return results;
}

function generateResultMessages(results, singleFileMode) {
  const { validFiles, invalidFiles, duplicateFiles, oversizedFiles, totalFiles } = results;

  // Success messages
  if (validFiles.length > 0) {
    if (singleFileMode) {
      results.info.push(`File loaded successfully`);
    } else {
      results.info.push(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully`);
    }
  }

  // Warning messages
  if (invalidFiles.length > 0) {
    results.warnings.push(
      `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} filtered out (invalid type)`
    );
  }

  if (duplicateFiles.length > 0) {
    results.warnings.push(
      `${duplicateFiles.length} duplicate file${duplicateFiles.length > 1 ? 's' : ''} skipped`
    );
  }

  if (oversizedFiles.length > 0) {
    results.warnings.push(
      `${oversizedFiles.length} file${oversizedFiles.length > 1 ? 's' : ''} too large (skipped)`
    );
  }

  // Error messages
  if (validFiles.length === 0 && totalFiles > 0) {
    results.errors.push('No valid files could be processed');
  }

  // Complex scenarios
  if (invalidFiles.length > 0 && duplicateFiles.length > 0) {
    results.info.push(
      `Processed ${totalFiles} files: ${validFiles.length} added, ${invalidFiles.length} invalid, ${duplicateFiles.length} duplicates`
    );
  }
}

// Helper function to get readable file types
export function getReadableFileTypes(acceptedTypes) {
  const types = Array.isArray(acceptedTypes) 
    ? acceptedTypes 
    : acceptedTypes.split(',').map(type => type.trim());

  return types.map(type => {
    if (type === 'application/pdf') return 'PDF files';
    if (type.startsWith('image/')) return 'Image files';
    return type;
  }).join(', ');
}

// Helper function to format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 