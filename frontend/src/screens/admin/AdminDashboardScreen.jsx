import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getAdminDashboardStats } from '../../actions/adminActions';
import { getAdminJobs } from '../../actions/adminActions';
import Loader from '../../components/common/Loader';
import Message from '../../components/common/Message';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Register ChartJS components
Chart.register(...registerables);

const AdminDashboardScreen = () => {
  const dispatch = useDispatch();

  const adminDashboard = useSelector((state) => state.adminDashboard);
  const { loading, error, stats } = adminDashboard;

  const adminJobs = useSelector((state) => state.adminJobs);
  const { loading: jobsLoading, error: jobsError, jobs } = adminJobs;

  useEffect(() => {
    dispatch(getAdminDashboardStats());
    dispatch(getAdminJobs());
  }, [dispatch]);

  // Prepare data for Status Chart
  const statusChartData = {
    labels: ['Open', 'Closed'],
    datasets: [
      {
        data: stats ? [stats.openJobs, stats.closedJobs] : [0, 0],
        backgroundColor: ['#2563eb', '#9ca3af'],
        borderWidth: 0,
      },
    ],
  };

  // Prepare data for Applications Chart
  const applicationsChartData = {
    labels: ['Applied', 'Shortlisted', 'Rejected', 'Interviewing', 'Hired'],
    datasets: [
      {
        label: 'Applications by Status',
        data: stats && stats.applicationsByStatus ?
          [
            stats.applicationsByStatus.Applied,
            stats.applicationsByStatus.Shortlisted,
            stats.applicationsByStatus.Rejected,
            stats.applicationsByStatus.Interviewing,
            stats.applicationsByStatus.Hired,
          ] : [0, 0, 0, 0, 0],
        backgroundColor: [
          '#3b82f6', // blue-500
          '#10b981', // green-500
          '#ef4444', // red-500
          '#f59e0b', // amber-500
          '#8b5cf6', // purple-500
        ],
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Admin Dashboard</h1>

        <Link to="/admin/jobs/create" className="btn btn-primary">
          <FontAwesomeIcon icon="plus" className="mr-2" />
          Post New Job
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="error">{error}</Message>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                  <FontAwesomeIcon icon="briefcase" size="lg" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Jobs</h3>
                  <p className="text-3xl font-bold">{stats ? stats.totalJobs : 0}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Open: {stats ? stats.openJobs : 0}</span>
                <span className="text-gray-500">Closed: {stats ? stats.closedJobs : 0}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 text-green-600 p-3 rounded-full mr-4">
                  <FontAwesomeIcon icon="users" size="lg" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Applications</h3>
                  <p className="text-3xl font-bold">{stats ? stats.totalApplications : 0}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Shortlisted: {stats && stats.applicationsByStatus ? stats.applicationsByStatus.Shortlisted : 0}
                </span>
                <span className="text-gray-500">
                  Hired: {stats && stats.applicationsByStatus ? stats.applicationsByStatus.Hired : 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 text-purple-600 p-3 rounded-full mr-4">
                  <FontAwesomeIcon icon="percentage" size="lg" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Average Match Score</h3>
                  <p className="text-3xl font-bold">{stats ? stats.averageMatchScore : 0}%</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Based on {stats ? stats.totalApplications : 0} applications
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 text-amber-600 p-3 rounded-full mr-4">
                  <FontAwesomeIcon icon="file-alt" size="lg" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Resumes</h3>
                  <p className="text-3xl font-bold">{stats ? stats.totalResumes : 0}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                All candidates in database
              </div>
            </div>
          </div>


          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Job Status</h2>
              <div className="h-64">
                <Doughnut
                  data={statusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                    cutout: '70%',
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Applications by Status</h2>
              <div className="h-64">
                <Bar
                  data={applicationsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Job Postings */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Job Postings</h2>
              <Link to="/admin/jobs" className="text-blue-600 text-sm hover:underline">
                View All
                <FontAwesomeIcon icon="arrow-right" className="ml-1" />
              </Link>
            </div>

            {jobsLoading ? (
              <Loader />
            ) : jobsError ? (
              <Message variant="error">{jobsError}</Message>
            ) : jobs.length === 0 ? (
              <p className="text-gray-500">No job postings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.slice(0, 5).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{job.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {job.applicationCount} ({job.shortlistedCount} shortlisted)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${job.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link to={`/admin/jobs/${job.id}/applications`} className="text-blue-600 hover:text-blue-900 mr-3">
                            <FontAwesomeIcon icon="users" className="mr-1" />
                            View
                          </Link>
                          <Link to={`/admin/jobs/${job.id}/edit`} className="text-amber-600 hover:text-amber-900">
                            <FontAwesomeIcon icon="edit" className="mr-1" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Resumes */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Resume Uploads</h2>
              <span className="text-gray-500 text-sm">Latest candidates</span>
            </div>

            {!stats || !stats.recentResumes || stats.recentResumes.length === 0 ? (
              <p className="text-gray-500">No resumes uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentResumes.map((resume) => (
                      <tr key={resume.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{resume.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{resume.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{resume.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${resume.resumeScore >= 70 ? 'bg-green-100 text-green-800' :
                            resume.resumeScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                            {resume.resumeScore || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={resume.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            <FontAwesomeIcon icon="download" className="mr-1" />
                            Resume
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>

      )}
    </div>
  );
};

export default AdminDashboardScreen;