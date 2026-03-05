import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getJobDetails, getJobApplications, updateApplicationStatus } from '../../actions/jobActions';
import { APPLICATION_STATUSES } from '../../config';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const scoreColor = (score) => {
  if (score >= 75) return 'text-green-600 bg-green-50';
  if (score >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

const matchBarColor = (score) => {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

const statusBadgeClass = (status) => {
  switch (status) {
    case 'Applied': return 'bg-blue-100 text-blue-800';
    case 'Shortlisted': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    case 'Interviewing': return 'bg-amber-100 text-amber-800';
    case 'Hired': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/* ─── component ─────────────────────────────────────────────────────────────── */
const AdminJobApplicationsScreen = () => {
  const { id: jobId } = useParams();
  const dispatch = useDispatch();

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState('');
  const [sortField, setSortField] = useState('matchScore');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('');

  const jobDetails = useSelector((s) => s.jobDetails);
  const { loading: jobLoading, error: jobError, job } = jobDetails;

  const jobApplicationsList = useSelector((s) => s.jobApplicationsList);
  const { loading: applicationsLoading, error: applicationsError, applications } = jobApplicationsList;

  const jobApplicationUpdate = useSelector((s) => s.jobApplicationUpdate);
  const { loading: updateLoading, error: updateError, success: updateSuccess } = jobApplicationUpdate;

  useEffect(() => {
    dispatch(getJobDetails(jobId));
    dispatch(getJobApplications(jobId));
  }, [dispatch, jobId, updateSuccess]);

  /* sorting */
  const sorted = applications
    ? [...applications].sort((a, b) => {
      if (sortField === 'matchScore') {
        return sortDirection === 'desc' ? b.matchScore - a.matchScore : a.matchScore - b.matchScore;
      }
      if (sortField === 'resumeScore') {
        return sortDirection === 'desc'
          ? (b.resume?.resumeScore ?? 0) - (a.resume?.resumeScore ?? 0)
          : (a.resume?.resumeScore ?? 0) - (b.resume?.resumeScore ?? 0);
      }
      if (sortField === 'name') {
        return sortDirection === 'desc'
          ? b.resume?.name?.localeCompare(a.resume?.name)
          : a.resume?.name?.localeCompare(b.resume?.name);
      }
      if (sortField === 'appliedAt') {
        return sortDirection === 'desc'
          ? new Date(b.appliedAt) - new Date(a.appliedAt)
          : new Date(a.appliedAt) - new Date(b.appliedAt);
      }
      return 0;
    })
    : [];

  const filtered = sorted.filter((app) => (filterStatus ? app.status === filterStatus : true));

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const openDetailModal = (app) => { setSelectedApplication(app); setShowDetailModal(true); };
  const openStatusModal = (app) => { setSelectedApplication(app); setStatusToUpdate(app.status); setShowStatusModal(true); };

  const handleStatusUpdate = () => {
    if (selectedApplication && statusToUpdate) {
      dispatch(updateApplicationStatus(jobId, selectedApplication._id, statusToUpdate));
      setShowStatusModal(false);
    }
  };

  const SortIcon = ({ field }) =>
    sortField === field ? (
      <FontAwesomeIcon
        icon={sortDirection === 'asc' ? 'sort-amount-up' : 'sort-amount-down'}
        className="ml-1 text-blue-500"
      />
    ) : null;

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
        <div>
          <Link to="/admin/jobs" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <FontAwesomeIcon icon="arrow-left" className="mr-2" />
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold">Job Applications</h1>
          {job && (
            <p className="text-gray-600 mt-1">
              <FontAwesomeIcon icon="briefcase" className="mr-1 text-blue-500" />
              <strong>{job.title}</strong> — {job.location}
            </p>
          )}
        </div>

        <Link to={`/admin/messaging/${jobId}`} className="btn btn-primary self-start">
          <FontAwesomeIcon icon="comment" className="mr-2" />
          Message Applicants
        </Link>
      </div>

      {/* Summary Bar */}
      {!applicationsLoading && applications && applications.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', count: applications.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Shortlisted', count: applications.filter((a) => a.status === 'Shortlisted').length, color: 'bg-green-50 text-green-700' },
            { label: 'Interviewing', count: applications.filter((a) => a.status === 'Interviewing').length, color: 'bg-amber-50 text-amber-700' },
            { label: 'Hired', count: applications.filter((a) => a.status === 'Hired').length, color: 'bg-purple-50 text-purple-700' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-lg p-4 text-center ${color} font-semibold shadow-sm`}>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label htmlFor="filterStatus" className="block text-xs text-gray-500 mb-1 font-medium">Filter by Status</label>
          <select
            id="filterStatus"
            className="input py-1 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setFilterStatus('')}
          className="btn btn-ghost border border-gray-300 py-1 text-sm mt-4"
          disabled={!filterStatus}
        >
          <FontAwesomeIcon icon="times" className="mr-1" />
          Clear
        </button>
        <span className="text-sm text-gray-500 ml-auto">
          Showing <strong>{filtered.length}</strong> of <strong>{applications?.length ?? 0}</strong> applicant(s)
        </span>
      </div>

      {/* Table */}
      {jobLoading || applicationsLoading ? (
        <Loader />
      ) : jobError || applicationsError ? (
        <Message variant="error">{jobError || applicationsError}</Message>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FontAwesomeIcon icon="users" className="text-gray-300 text-6xl mb-4" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Applications Yet</h2>
          <p className="text-gray-400">Applications will appear here once candidates apply.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Candidate */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-800 focus:outline-none" onClick={() => toggleSort('name')}>
                      Candidate <SortIcon field="name" />
                    </button>
                  </th>
                  {/* Phone */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  {/* Resume Score */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-800 focus:outline-none" onClick={() => toggleSort('resumeScore')}>
                      Resume Score <SortIcon field="resumeScore" />
                    </button>
                  </th>
                  {/* Match Score */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-800 focus:outline-none" onClick={() => toggleSort('matchScore')}>
                      Job Match <SortIcon field="matchScore" />
                    </button>
                  </th>
                  {/* Skills */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skills
                  </th>
                  {/* Status */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {/* Applied On */}
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-800 focus:outline-none" onClick={() => toggleSort('appliedAt')}>
                      Applied On <SortIcon field="appliedAt" />
                    </button>
                  </th>
                  {/* Actions */}
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    {/* Candidate */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <FontAwesomeIcon icon="user" className="text-blue-500 text-sm" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{app.resume?.name || '—'}</div>
                          <div className="text-xs text-gray-500">{app.resume?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    {/* Phone */}
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {app.resume?.phone ? (
                        <a href={`tel:${app.resume.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <FontAwesomeIcon icon="phone" className="text-xs" />
                          {app.resume.phone}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Not provided</span>
                      )}
                    </td>
                    {/* Resume Score */}
                    <td className="px-5 py-4">
                      {app.resume?.resumeScore !== undefined ? (
                        <span className={`px-2 py-1 rounded-full text-sm font-bold ${scoreColor(app.resume.resumeScore)}`}>
                          {app.resume.resumeScore}/100
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    {/* Job Match Score */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${matchBarColor(app.matchScore)}`}
                            style={{ width: `${Math.min(100, Math.round(app.matchScore))}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {Math.round(app.matchScore)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        S:{Math.round(app.skillMatchScore)}% E:{Math.round(app.experienceMatchScore)}% Ed:{Math.round(app.educationMatchScore)}%
                      </div>
                    </td>
                    {/* Skills */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(app.resume?.skills || []).slice(0, 3).map((skill, i) => (
                          <span key={i} className="badge badge-accent text-xs">{skill}</span>
                        ))}
                        {(app.resume?.skills || []).length > 3 && (
                          <span className="badge badge-accent text-xs">+{app.resume.skills.length - 3}</span>
                        )}
                        {!(app.resume?.skills?.length) && <span className="text-gray-400 text-xs">—</span>}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${statusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    {/* Applied On */}
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openDetailModal(app)}
                        className="text-blue-600 hover:text-blue-900 mr-3 text-sm"
                        title="View full details"
                      >
                        <FontAwesomeIcon icon="eye" className="mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => openStatusModal(app)}
                        className="text-amber-600 hover:text-amber-900 text-sm"
                        title="Update status"
                      >
                        <FontAwesomeIcon icon="edit" className="mr-1" />
                        Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Full Detail Modal ──────────────────────────────────────────────── */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">Applicant Full Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-700">
                <FontAwesomeIcon icon="times" size="lg" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact Info</h3>
                  <p className="font-semibold text-gray-900 text-lg mb-1">
                    <FontAwesomeIcon icon="user" className="mr-2 text-blue-400" />
                    {selectedApplication.resume?.name || '—'}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <FontAwesomeIcon icon="envelope" className="mr-2 text-gray-400" />
                    {selectedApplication.resume?.email || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <FontAwesomeIcon icon="phone" className="mr-2 text-gray-400" />
                    {selectedApplication.resume?.phone || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Scores</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-500 w-24">Resume Score</span>
                    <span className={`px-2 py-0.5 rounded-full text-sm font-bold ${scoreColor(selectedApplication.resume?.resumeScore ?? 0)}`}>
                      {selectedApplication.resume?.resumeScore ?? '—'}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-gray-500 w-24">Job Match</span>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${matchBarColor(selectedApplication.matchScore)}`}
                          style={{ width: `${Math.min(100, Math.round(selectedApplication.matchScore))}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{Math.round(selectedApplication.matchScore)}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 space-y-0.5 pl-24">
                    <div>Skills: {Math.round(selectedApplication.skillMatchScore)}%</div>
                    <div>Experience: {Math.round(selectedApplication.experienceMatchScore)}%</div>
                    <div>Education: {Math.round(selectedApplication.educationMatchScore)}%</div>
                  </div>
                </div>
              </div>

              {/* Resume Download */}
              {selectedApplication.resume?.resumeUrl && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <FontAwesomeIcon icon="file-alt" className="text-blue-500 text-xl" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Resume File</p>
                    <p className="text-xs text-gray-500">Stored on Cloudinary</p>
                  </div>
                  <a
                    href={selectedApplication.resume.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary text-xs py-1.5 px-3"
                  >
                    <FontAwesomeIcon icon="download" className="mr-1" />
                    Download
                  </a>
                </div>
              )}

              {/* Applied Job */}
              {selectedApplication.resume?.appliedJobTitle && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
                  <FontAwesomeIcon icon="briefcase" />
                  Applied for: <strong>{selectedApplication.resume.appliedJobTitle}</strong>
                </div>
              )}

              {/* Skills */}
              {selectedApplication.resume?.skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.resume.skills.map((skill, i) => (
                      <span key={i} className="badge badge-accent">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedApplication.resume?.education?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Education</h3>
                  <ul className="space-y-2">
                    {selectedApplication.resume.education.map((edu, i) => (
                      <li key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-900">{edu.institution}</div>
                        <div className="text-gray-600">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</div>
                        {edu.gpa && <div className="text-gray-500 text-xs">GPA: {edu.gpa}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Experience */}
              {selectedApplication.resume?.experience?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Experience</h3>
                  <ul className="space-y-2">
                    {selectedApplication.resume.experience.map((exp, i) => (
                      <li key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-gray-900">{exp.position} at {exp.company}</div>
                        {exp.description && <div className="text-gray-600 text-xs mt-1">{exp.description}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LLM Reasoning */}
              {selectedApplication.llmReasoning && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">AI Match Analysis</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                    {selectedApplication.llmReasoning}
                  </div>
                </div>
              )}

              {/* Chatbot Responses */}
              {selectedApplication.resume?.chatbotResponses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Chatbot Q&A</h3>
                  <div className="space-y-3">
                    {selectedApplication.resume.chatbotResponses.map((resp, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="font-medium text-blue-700 mb-1">Q: {resp.question}</div>
                        <div className="text-gray-700">A: {resp.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => { setShowDetailModal(false); openStatusModal(selectedApplication); }}
                className="btn btn-primary text-sm"
              >
                <FontAwesomeIcon icon="edit" className="mr-2" />
                Update Status
              </button>
              <button onClick={() => setShowDetailModal(false)} className="btn btn-ghost border border-gray-300 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Update Modal ───────────────────────────────────────────── */}
      {showStatusModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Update Application Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-700">
                <FontAwesomeIcon icon="times" size="lg" />
              </button>
            </div>

            <p className="text-gray-700 mb-4">
              Updating status for: <span className="font-semibold">{selectedApplication.resume?.name}</span>
            </p>

            <label htmlFor="statusSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select New Status
            </label>
            <select
              id="statusSelect"
              className="input mb-4"
              value={statusToUpdate}
              onChange={(e) => setStatusToUpdate(e.target.value)}
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {updateError && <Message variant="error">{updateError}</Message>}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowStatusModal(false)} className="btn btn-ghost border border-gray-300">
                Cancel
              </button>
              <button onClick={handleStatusUpdate} className="btn btn-primary" disabled={updateLoading}>
                {updateLoading ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobApplicationsScreen;