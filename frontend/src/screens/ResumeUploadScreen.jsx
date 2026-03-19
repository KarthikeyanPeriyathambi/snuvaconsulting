import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { uploadResume, improveResume, saveImprovedResume } from '../actions/resumeActions';
import { RESUME_UPLOAD_RESET, RESUME_IMPROVE_RESET, RESUME_SAVE_IMPROVED_RESET } from '../constants/resumeConstants';
import {
  faLightbulb, faRotateRight, faBriefcase, faCheck,
  faArrowRight, faCheckCircle, faTimesCircle, faTimes,
  faUpload, faFileAlt, faPaperPlane, faQuestionCircle,
  faExclamationTriangle, faMagic, faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';

// ── Helpers ────────────────────────────────────────────────────────────
const scoreColor = (s) => s >= 75 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';

const ResumeUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [fileIcon, setFileIcon] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Workflow States
  const [showResultModal, setShowResultModal] = useState(false);
  const [showImproveOptions, setShowImproveOptions] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showChatbotSuggestion, setShowChatbotSuggestion] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const appliedJobId = queryParams.get('jobId') || '';
  const appliedJobTitle = queryParams.get('jobTitle') || '';

  const resumeUpload = useSelector((state) => state.resumeUpload);
  const { loading, error, success, resume } = resumeUpload;

  const resumeImprove = useSelector((state) => state.resumeImprove);
  const { loading: improving, success: improveSuccess, improvedData } = resumeImprove;

  const resumeSaveImproved = useSelector((state) => state.resumeSaveImproved);
  const { loading: savingImproved, success: saveImprovedSuccess } = resumeSaveImproved;

  useEffect(() => {
    dispatch({ type: RESUME_UPLOAD_RESET });
    dispatch({ type: RESUME_IMPROVE_RESET });
    dispatch({ type: RESUME_SAVE_IMPROVED_RESET });
  }, [dispatch]);

  useEffect(() => {
    if (saveImprovedSuccess) {
        if (resume?.id && appliedJobId) {
            navigate(`/chatbot/${resume.id}/${appliedJobId}`);
        }
    }
  }, [saveImprovedSuccess, resume, appliedJobId, navigate]);

  useEffect(() => {
    if (success && resume) {
      setShowResultModal(true);
      // Logic for missing requirements
      if (resume.matchCategory === 'PARTIAL' || resume.eligibility === 'UNDER_QUALIFIED') {
          setShowChatbotSuggestion(true);
      }
    }
  }, [success, resume]);

  const validateFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setUploadError('Please upload a PDF or DOCX file');
      return;
    }
    setUploadError('');
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileIcon(selectedFile.type === 'application/pdf' ? 'file-pdf' : 'file-word');
  };

  const handleFileChange = (e) => { if (e.target.files[0]) validateFile(e.target.files[0]); };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!file) { setUploadError('Please select a file'); return; }
    const formData = new FormData();
    formData.append('resume', file);
    if (appliedJobId) formData.append('appliedJobId', appliedJobId);
    if (appliedJobTitle) formData.append('appliedJobTitle', appliedJobTitle);
    dispatch(uploadResume(formData));
  };

  const handleAutoUpdate = () => {
    dispatch(improveResume(resume.id, appliedJobId));
    setShowImproveOptions(false);
    setShowComparison(true);
  };

  const closeModal = () => {
    setShowResultModal(false);
    setShowImproveOptions(false);
    setShowComparison(false);
    setShowChatbotSuggestion(false);
  };

  const handleNext = () => {
    if (improvedData && resume?.id) {
        // If we have improved data, save it first (the useEffect will handle navigation)
        dispatch(saveImprovedResume(resume.id, improvedData));
    } else if (resume?.id && appliedJobId) {
        navigate(`/chatbot/${resume.id}/${appliedJobId}`);
    } else {
        navigate('/application-success/none');
    }
  };

  const handleSaveOnly = () => {
      if (improvedData && resume?.id) {
          dispatch(saveImprovedResume(resume.id, improvedData));
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumbs/Progress */}
        <div className="flex items-center justify-between mb-8 px-4">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                <span className="text-xs mt-1 font-medium text-primary-600">Select Job</span>
            </div>
            <div className="h-0.5 bg-primary-600 flex-1 mx-2"></div>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                <span className="text-xs mt-1 font-medium text-primary-600">Upload Resume</span>
            </div>
            <div className="h-0.5 bg-gray-300 flex-1 mx-2"></div>
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center font-bold text-sm">3</div>
                <span className="text-xs mt-1 font-medium text-gray-400">Screening</span>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Upload Resume</h1>
              <p className="text-gray-600">We'll check if your skills match the selected job.</p>
            </div>

            {appliedJobTitle && (
              <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBriefcase} />
                </div>
                <div>
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Target Position</div>
                  <div className="text-gray-900 font-bold">{appliedJobTitle}</div>
                </div>
              </div>
            )}

            <form onSubmit={submitHandler}>
              <div
                className={`border-3 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center mb-8 transition-all ${
                  dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]); }}
              >
                {file ? (
                  <div className="text-center">
                    <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FontAwesomeIcon icon={faFileAlt} size="3x" />
                    </div>
                    <p className="font-bold text-gray-900 mb-1">{fileName}</p>
                    <p className="text-xs text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      type="button"
                      onClick={() => { setFile(null); setFileName(''); }}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1 mx-auto"
                    >
                      <FontAwesomeIcon icon={faTimes} /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                      <FontAwesomeIcon icon={faUpload} size="2x" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">Drag and drop your resume</p>
                    <p className="text-sm text-gray-400 mb-6">PDF or DOCX (max 5MB)</p>
                    <label className="bg-white border-2 border-primary-600 text-primary-600 px-6 py-2 rounded-lg font-bold cursor-pointer hover:bg-primary-50 transition-colors">
                      Browse Files
                      <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" />
                    </label>
                  </>
                )}
              </div>

              {uploadError && <Message variant="error" className="mb-6">{uploadError}</Message>}
              {error && <Message variant="error" className="mb-6">{error}</Message>}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader size="sm" /> : <><FontAwesomeIcon icon={faPaperPlane} /> Check Eligibility</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Workflow Modals ──────────────────────────────────────────── */}
      
      {showResultModal && resume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp">
            {/* Header: REJECTION CASE (Step 2 Part 1 & 2) */}
            {resume.rejected || resume.matchCategory === 'NO_MATCH' || resume.eligibility === 'OVER_QUALIFIED' ? (
              <div className="p-10 text-center">
                <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-red-50">
                  <FontAwesomeIcon icon={faTimesCircle} size="4x" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-4">Resume Not Matched</h2>
                <p className="text-gray-600 text-lg mb-8">
                  {resume.eligibility === 'OVER_QUALIFIED' 
                    ? "Our AI determined you are over-qualified for this specific role." 
                    : "Unfortunately, your background doesn't yet align with this specific role's requirements."}
                </p>
                
                <div className="bg-red-50 rounded-2xl p-6 text-left mb-8 border border-red-100">
                  <div className="flex items-center gap-2 text-red-700 font-bold mb-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    Reasons for Rejection
                  </div>
                  <ul className="space-y-3">
                    {(resume.lowScoreReasons && resume.lowScoreReasons.length > 0 ? resume.lowScoreReasons : ['Skills mismatch', 'Industry experience divergence']).map((r, i) => (
                      <li key={i} className="text-red-700 text-sm font-medium flex items-start gap-3">
                        <span className="w-2 h-2 bg-red-400 rounded-full mt-1.5 shrink-0"></span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={closeModal}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 shadow-xl transition-all active:scale-95"
                >
                  Close & Try Another Position
                </button>
              </div>
            ) : (
              /* Header: MATCH / PARTIAL CASE (Step 3) */
              <div className="p-8">
                <div className="flex justify-between items-start mb-10 text-left">
                  <div className="max-w-[70%]">
                    <h2 className="text-3xl font-black text-gray-900 leading-tight">Match Success!</h2>
                    <p className="text-gray-500 mt-2 text-lg">Your profile has been analyzed against <strong>{appliedJobTitle}</strong></p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black" style={{ color: scoreColor(resume.matchScore) }}>{Math.round(resume.matchScore)}%</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Overall Match</div>
                  </div>
                </div>

                {/* Score Indicators */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                   <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-left">
                      <div className="text-xs text-gray-400 font-bold uppercase mb-2">Match Quality</div>
                      <div className={`text-xl font-black uppercase ${(resume?.matchCategory || 'MATCH') === 'MATCH' ? 'text-green-600' : 'text-orange-500'}`}>
                         {resume?.matchCategory || 'MATCH'}
                      </div>
                   </div>
                   <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 text-left">
                      <div className="text-xs text-gray-400 font-bold uppercase mb-2">Experience Status</div>
                      <div className={`text-xl font-black uppercase ${(resume?.eligibility || 'ELIGIBLE') === 'ELIGIBLE' ? 'text-green-600' : 'text-blue-500'}`}>
                         {(resume?.eligibility || 'ELIGIBLE').replace('_', ' ')}
                      </div>
                   </div>
                </div>

                {/* Step 3: Two Way Buttons */}
                <div className="space-y-4 mb-10">
                  <button 
                    onClick={() => setShowImproveOptions(true)}
                    className="w-full flex items-center justify-between p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 hover:bg-amber-100 transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-amber-200 text-amber-700 rounded-2xl flex items-center justify-center font-bold">
                        <FontAwesomeIcon icon={faLightbulb} size="lg" />
                      </div>
                      <div>
                        <div className="font-black text-amber-900">Why is the score low?</div>
                        <div className="text-sm text-amber-700">See how to increase your compatibility</div>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={handleAutoUpdate}
                    className="w-full flex items-center justify-between p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 bg-indigo-200 text-indigo-700 rounded-2xl flex items-center justify-center font-bold">
                        <FontAwesomeIcon icon={faMagic} size="lg" />
                      </div>
                      <div>
                        <div className="font-black text-indigo-900">Auto Resume Update</div>
                        <div className="text-sm text-indigo-700">Let AI optimize your resume instantly</div>
                      </div>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Final Actions (Step 4: Button Click Required to Move) */}
                <div className="flex gap-4">
                  <button 
                    onClick={closeModal} 
                    className="flex-1 py-5 border-3 border-gray-100 text-gray-400 rounded-3xl font-black hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Re-upload
                  </button>
                  <button 
                    onClick={handleNext} 
                    className="flex-[2] py-5 bg-primary-600 text-white rounded-3xl font-black text-lg hover:bg-primary-700 shadow-2xl shadow-primary-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    Submit & Proceed <FontAwesomeIcon icon={faCheck} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ── Auto-Update / Comparison Modal ──────────────────────────────────── */}
      {showComparison && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-gray-900">AI Resume Optimizer</h3>
              <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center"><FontAwesomeIcon icon={faTimes} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {improving ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <Loader />
                  <p className="mt-4 font-bold text-gray-600 animate-pulse">Our AI is rewriting your points to match the job criteria...</p>
                </div>
              ) : improvedData ? (
                <div className="grid md:grid-cols-2 gap-8 h-full">
                  {/* Left: Updated */}
                  <div className="flex flex-col h-full border-2 border-green-100 rounded-2xl bg-green-50/30 overflow-hidden">
                    <div className="p-4 bg-green-500 text-white font-bold flex justify-between items-center">
                      <span>IMPROVED RESUME</span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Optimized for Match</span>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto font-serif text-sm">
                      <h4 className="font-bold border-b-2 border-green-200 pb-1 mb-4">Skills</h4>
                      <p className="mb-6">{improvedData.skills.join(', ')}</p>
                      <h4 className="font-bold border-b-2 border-green-200 pb-1 mb-4">Experience</h4>
                      {improvedData.experience.map((e, i) => (
                        <div key={i} className="mb-4">
                          <div className="font-bold">{e.position} at {e.company}</div>
                          <p className="text-gray-700">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Original */}
                  <div className="flex flex-col h-full border-2 border-gray-100 rounded-2xl bg-gray-50 overflow-hidden">
                    <div className="p-4 bg-gray-400 text-white font-bold">ORIGINAL DATA</div>
                    <div className="flex-1 p-6 overflow-y-auto font-serif text-sm opacity-60">
                      <h4 className="font-bold border-b pb-1 mb-4">Skills</h4>
                      <p className="mb-6">{resume.skills.join(', ')}</p>
                      <h4 className="font-bold border-b pb-1 mb-4">Experience</h4>
                      {resume.experience.map((e, i) => (
                        <div key={i} className="mb-4">
                          <div className="font-bold">{e.position} at {e.company}</div>
                          <p className="text-gray-700">{e.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-6 bg-gray-50 border-t flex justify-between gap-4">
               <div>
                 <button onClick={handleAutoUpdate} className="px-6 py-3 border-2 border-gray-300 rounded-2xl font-bold hover:bg-white mr-4"><FontAwesomeIcon icon={faRotateRight} /> Re-Check</button>
               </div>
               <div className="flex gap-4">
                 <button 
                   onClick={handleSaveOnly} 
                   disabled={savingImproved}
                   className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black disabled:opacity-50"
                 >
                   {savingImproved ? <Loader size="sm" /> : 'Auto Store Backend'}
                 </button>
                 <button 
                   onClick={handleNext} 
                   disabled={savingImproved}
                   className="px-12 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-100 disabled:opacity-50"
                 >
                   {savingImproved ? <Loader size="sm" /> : <>{'Proceed to Chatbot'} <FontAwesomeIcon icon={faArrowRight} className="ml-2" /></>}
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Low Score Improvement Details Popup ─────────────────────────────── */}
      {showImproveOptions && resume && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 relative">
            <button onClick={() => setShowImproveOptions(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FontAwesomeIcon icon={faTimes} /></button>
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faLightbulb} className="text-amber-500" />
              Improvement Guide
            </h3>
            <p className="text-gray-600 mb-6 font-medium">Here's why your score isn't perfect and how you can fix it manually:</p>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="text-xs font-bold text-blue-600 uppercase mb-1">Missing Keywords</div>
                <div className="text-sm font-semibold">{resume.missingSkills?.join(', ') || 'N/A'}</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="text-xs font-bold text-orange-600 uppercase mb-1">Improvement Areas</div>
                <div className="text-sm italic text-gray-700">"{resume.matchFeedback}"</div>
              </div>
            </div>

            <button 
              onClick={() => { setShowResultModal(false); setFile(null); setFileName(''); setShowImproveOptions(false); }}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700"
            >
              Okay, I'll Update Manually
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ResumeUploadScreen;