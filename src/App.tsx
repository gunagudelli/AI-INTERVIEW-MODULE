import React, { useEffect, Suspense } from "react";

import { Route, useLocation, Routes, Navigate } from "react-router-dom";
import { useGtagPageView } from "./Pages/Auth/useGtagPageView";
import { useTokenRefresh } from "./utils/useTokenRefresh";
import { initGA, trackPage } from "./utils/analytics";

import { CandidateDetail } from "./AIMockInterview/admin/CandidateDetail";
import { AdminDashboard } from "./AIMockInterview/admin/AdminDashboard";
import CandidateLayout from "./layouts/CandidateLayout";
import CandidateDashboard from "./Pages/candidate/CandidateDashboard";
import InterviewHistory from "./Pages/candidate/InterviewHistory";
import UpcomingInterviews from "./Pages/candidate/UpcomingInterviews";
import ProfileSettings from "./Pages/candidate/ProfileSettings";
import Notifications from "./Pages/candidate/Notifications";
import JobListPage from "./Pages/candidate/JobListPage";
import ApplyPage from "./Pages/candidate/ApplyPage";
import ApplicationStatusPage from "./Pages/candidate/ApplicationStatusPage";
import RecruiterLogin from "./Pages/recruiter/RecruiterLogin";
import RecruiterRegister from "./Pages/recruiter/RecruiterRegister";
import RecruiterDashboard from "./Pages/recruiter/RecruiterDashboard";
import CreateJob from "./Pages/recruiter/CreateJob";
import JobsList from "./Pages/recruiter/JobsList";
import JobApplications from "./Pages/recruiter/JobApplications";
import RecruiterProfile from "./Pages/recruiter/RecruiterProfile";
import RecruiterAnalytics from "./Pages/recruiter/RecruiterAnalytics";
import RecruiterSettings from "./Pages/recruiter/RecruiterSettings";
import ResumePool from "./Pages/recruiter/ResumePool";
import EditJob from "./Pages/recruiter/EditJob";
import CandidatesList from "./Pages/recruiter/CandidatesList";
import ApplicationDetail from "./Pages/recruiter/ApplicationDetail";
import RecruiterLayout from "./layouts/RecruiterLayout";
import RecruiterReferrals from "./Pages/referral/RecruiterReferrals";
import EmployeeReferralLogin from "./Pages/referral/EmployeeReferralLogin";
import EmployeeReferralRegister from "./Pages/referral/EmployeeReferralRegister";
import EmployeeReferralDashboard from "./Pages/referral/EmployeeReferralDashboard";
import { MultiLevelSelection, ProctoredInterview } from "./AIMockInterview";
import InterviewPage from "./AIMockInterview/interview";

import LoginAdmin from "./AIMockInterview/admin/LoginAdmin";


// Simple centered loader component
const LoadingSpinner = React.memo(() => {
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .loader {
        width: 50px;
        aspect-ratio: 1;
        display: grid;
        border: 4px solid #0000;
        border-radius: 50%;
        border-right-color: #5c3391;
        animation: l15 1s infinite linear;
      }
      .loader::before,
      .loader::after {
        content: "";
        grid-area: 1/1;
        margin: 2px;
        border: inherit;
        border-radius: 50%;
        animation: l15 2s infinite;
      }
      .loader::after {
        margin: 8px;
        animation-duration: 3s;
      }
      @keyframes l15 {
        100% { transform: rotate(1turn); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div className="loader" />
      <div style={{ fontSize: "18px", color: "#333", marginTop: "16px" }}>
        Loading...
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const location = useLocation();

  useGtagPageView();

  useTokenRefresh();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (
      params.get("utm_source") ||
      params.get("utm_medium") ||
      params.get("utm_campaign")
    ) {
      const utmData = {
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
        content: params.get("utm_content"),
        term: params.get("utm_term"),
        fullUrl: window.location.href,
        pagePath: window.location.pathname,
      };

      console.log("UTM DATA:", utmData);
      localStorage.setItem("utmData", JSON.stringify(utmData));

      if ((window as any).gtag) {
        (window as any).gtag("event", "utm_landing", {
          page_location: window.location.href,
          page_path: window.location.pathname,
          utm_source: utmData.source,
          utm_medium: utmData.medium,
          utm_campaign: utmData.campaign,
          utm_content: utmData.content,
          utm_term: utmData.term,
        });
      }
    }
  }, []);
  // useEffect(() => {
  //     const rt = getRefreshToken();
  //     if (rt) {
  //       console.log("Refresh token found on app load, attempting refresh...");
  //       // You can trigger an immediate token refresh here if needed
  //     } else {
  //       console.log("No refresh token found on app load.");
  //     }
  //   }, []);

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPage(location.pathname);
  }, [location]);

  useEffect(() => {
    const validEntryPoints = [
      "/",
      "/future",
      "/freerice",
      "/glms",
      "/miyapurmetro",
      "/los",
      "/fms",
      "/cms",
      "/aiblockchainanditservices",
      "/caandcaservices",
      "/goldandsilveranddiamonds",
      "/loansinvestments",
      "/realestate",
      "/rice2roboecommers",
      "/nyayagpt",
      "/student-home",
      "/studyabroad",
      "/FreeAIBook",
      "/genoxyai-services",
      "/bharath-aistore",
      "/interview",
      "/accenture/jobs",
      "/accenturestats",
      "/techmahindra/jobs",
      "/allcompanies/jobs",
      "/broadridge/jobs",
      "/credera/jobs",
      "/viewjobdetails/default/ALL",
    ];
    if (validEntryPoints.includes(location.pathname)) {
      console.log("Setting entryPoint:", location.pathname); // Debug log
      localStorage.setItem("entryPoint", location.pathname);
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="App">
        <Routes>
          {/* ===================================================== */}
          {/* ✅ PUBLIC ROUTES (No Auth Needed) */}
          {/* ===================================================== */}

          <Route path="/login-admin" element={<LoginAdmin />} />

          <Route path="/" element={<RecruiterLogin />} />
          <Route path="/RecruiterLogin" element={<RecruiterLogin />} />
          <Route path="/RecruiterRegister" element={<RecruiterRegister />} />

          {/* Recruiter Dashboard with Sidebar */}
          <Route path="/recruiter/*" element={<RecruiterLayout />}>
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="jobs" element={<JobsList />} />
            <Route path="jobs/create" element={<CreateJob />} />
            <Route
              path="jobs/:jobId/applications"
              element={<JobApplications />}
            />
            <Route path="profile" element={<RecruiterProfile />} />
            <Route path="applications" element={<CandidatesList />} />
            <Route
              path="applications/:applicationId"
              element={<ApplicationDetail />}
            />
            <Route path="candidates" element={<CandidatesList />} />
            <Route path="referrals" element={<RecruiterReferrals />} />
            <Route path="analytics" element={<RecruiterAnalytics />} />
            <Route path="settings" element={<RecruiterSettings />} />
            <Route path="resume-pool" element={<ResumePool />} />
            <Route path="jobs/:jobId/edit" element={<EditJob />} />
          </Route>

          <Route path="/jobs" element={<JobListPage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/apply/:jobId" element={<ApplyPage />} />
          <Route
            path="/application/status/:id"
            element={<ApplicationStatusPage />}
          />
          <Route
            path="/admin/candidate/:userId"
            element={<CandidateDetail />}
          />
          <Route
            path="/admin/interviewdashboard"
            element={<AdminDashboard />}
          />

          {/* ===================================================== */}
          {/* ✅ CANDIDATE MODULE ROUTES */}
          {/* ===================================================== */}
          <Route path="/candidate" element={<CandidateLayout />}>
            <Route
              index
              element={<Navigate to="/candidate/dashboard" replace />}
            />
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="history" element={<InterviewHistory />} />
            <Route path="upcoming" element={<UpcomingInterviews />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="/referral/login" element={<EmployeeReferralLogin />} />
          <Route path="/referral/register" element={<EmployeeReferralRegister />} />
          <Route path="/referral/dashboard" element={<EmployeeReferralDashboard />} />

          <Route path="/multi-level-select" element={<MultiLevelSelection />} />
          <Route path="/multi-interview" element={<ProctoredInterview />} />
          <Route path="/assessment" element={<InterviewPage />} />
          <Route path="/interview" element={<InterviewPage />} />

        </Routes>
      </div>
    </Suspense>
  );
};

export default App;
