import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { uploadResume } from '../actions/resumeActions';
import { RESUME_UPLOAD_RESET } from '../constants/resumeConstants';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

const ResumeUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [fileIcon, setFileIcon] = useState(null);

  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Read appliedJobId and appliedJobTitle from URL query params
  // e.g. /upload-resume?jobId=xxx&jobTitle=Software+Engineer
  const queryParams = new URLSearchParams(location.search);
  const appliedJobId = queryParams.get('jobId') || '';
  const appliedJobTitle = queryParams.get('jobTitle') || '';

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const resumeUpload = useSelector((state) => state.resumeUpload);
  const { loading, error, success, resume } = resumeUpload;

  useEffect(() => {
    // Reset resume upload state when component mounts
    dispatch({ type: RESUME_UPLOAD_RESET });
  }, [dispatch]);

  useEffect(() => {
    if (success && resume) {
      setShowSuccess(true);

      const timer = setTimeout(() => {
        if (appliedJobId) {
          // If applying for a job, go to chatbot for screening
          // App.jsx defines this route as: /chatbot/:resumeId/:jobId
          navigate(`/chatbot/${resume._id}/${appliedJobId}`);
        } else {
          // If just uploading a general resume, go to success page
          // Note: App.jsx requires a jobId for success page: /application-success/:jobId
          // If no job, we might need to go somewhere else or provide a dummy ID
          navigate(`/application-success/none`);
        }
      }, 2500); // 2.5 seconds so they can read the score
      return () => clearTimeout(timer);
    }
  }, [success, resume, navigate, appliedJobId]);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const validateFile = (selectedFile) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(selectedFile.type)) {
      setUploadError('Please upload a PDF or DOCX file');
      setFile(null);
      setFileName('');
      setFileIcon(null);
      return;

    }

    if (selectedFile.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      setFile(null);
      setFileName('');
      setFileIcon(null);
      return;

    }

    setUploadError('');
    setFile(selectedFile);
    setFileName(selectedFile.name);

    if (selectedFile.type === 'application/pdf') {
      setFileIcon('file-pdf');
    } else {
      setFileIcon('file-word');
    }

  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);

      // Send the applied job info so the backend can store it
      if (appliedJobId) formData.append('appliedJobId', appliedJobId);
      if (appliedJobTitle) formData.append('appliedJobTitle', appliedJobTitle);

      dispatch(uploadResume(formData));
    } catch (error) {
      console.error('Submission error:', error);
      setUploadError('An error occurred during submission');
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  // Score colour helper
  const scoreColor = (score) => {
    if (score >= 75) return '#16a34a'; // green
    if (score >= 50) return '#d97706'; // amber
    return '#dc2626'; // red
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Upload Your Resume</h1>

        {/* Show applied job context banner */}
        {appliedJobTitle && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-2">
            <FontAwesomeIcon icon="briefcase" />
            <span>
              Applying for: <strong>{appliedJobTitle}</strong>
            </span>
          </div>
        )}

        {/* ── Success Popup Modal ──────────────────────────────────────── */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative overflow-hidden animate-bounce-in">
              {/* Decorative Background Blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-50"></div>

              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-200">
                <FontAwesomeIcon icon="check" className="text-green-600 text-3xl" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">Resume Received!</h2>
              <p className="text-sm text-gray-500 mb-6">Successfully processed & scored.</p>

              <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                {/* Resume Score */}
                {resume && resume.resumeScore !== undefined && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">AI Quality Score</p>
                    <div className="flex items-center justify-center">
                      <span
                        className="text-4xl font-black"
                        style={{ color: scoreColor(resume.resumeScore) }}
                      >
                        {resume.resumeScore}
                      </span>
                      <span className="text-gray-300 ml-1 text-lg font-medium">/ 100</span>
                    </div>
                  </div>
                )}

                {resume && resume.appliedJobTitle && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Role</p>
                    <p className="text-xs font-semibold text-blue-700 bg-blue-50 py-1 px-3 rounded-full inline-block">
                      {resume.appliedJobTitle}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (appliedJobId) navigate(`/chatbot/${resume._id}/${appliedJobId}`);
                  else navigate(`/application-success/none`);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
              >
                <span>Continue to Screening</span>
                <FontAwesomeIcon icon="arrow-right" className="group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[10px] text-gray-400 mt-4 animate-pulse">
                Automatically redirecting in a moment...
              </p>
            </div>
          </div>
        )}



        {error && <Message variant="error">{error}</Message>}
        {uploadError && <Message variant="error">{uploadError}</Message>}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <p className="text-gray-700 mb-6">
              Upload your resume to apply for jobs. We'll extract your skills, experience, and
              education to match you with the right opportunities.
            </p>

            <form onSubmit={submitHandler}>
              <div
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center mb-6 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="text-center">
                    {fileIcon && (
                      <div className="mb-3 text-blue-600">
                        <FontAwesomeIcon icon={fileIcon} size="4x" />
                      </div>
                    )}

                    <p className="font-medium text-gray-900 mb-1">{fileName}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFileName('');
                        setFileIcon(null);
                      }}

                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      <FontAwesomeIcon icon="times" className="mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <FontAwesomeIcon icon="upload" className="text-gray-400 text-3xl mb-3" />
                    <p className="text-gray-700 mb-2">
                      Drag and drop your resume here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      Supported formats: PDF, DOCX (Max 5MB)
                    </p>
                    <label className="btn btn-primary cursor-pointer">
                      <FontAwesomeIcon icon="file-alt" className="mr-2" />
                      Browse Files
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      />
                    </label>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-3"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <Loader size="sm" />
                    <span className="ml-2">Processing Resume...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon="paper-plane" className="mr-2" />
                    Upload &amp; Process Resume
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">What happens next?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <FontAwesomeIcon icon="check" className="text-green-500 mt-1 mr-2" />
                  <span>Our AI will extract your skills, experience, and education</span>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon="check" className="text-green-500 mt-1 mr-2" />
                  <span>Your resume score is calculated and stored</span>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon="check" className="text-green-500 mt-1 mr-2" />
                  <span>You'll be matched with suitable job opportunities</span>
                </li>
                <li className="flex items-start">
                  <FontAwesomeIcon icon="check" className="text-green-500 mt-1 mr-2" />
                  <span>Apply to jobs with a simple click and answer a few questions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadScreen;