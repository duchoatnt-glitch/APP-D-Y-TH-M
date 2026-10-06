import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { TimetableMatrixView } from './components/timetable/TimetableMatrixView.tsx';
import { ScheduleReminderView } from './components/scheduling/ScheduleReminderView.tsx';
import { NewSessionModal } from './components/scheduling/NewSessionModal.tsx';
import { MaterialsView } from './components/materials/MaterialsView.tsx';
import { MaterialModal, MaterialModalPresets } from './components/materials/MaterialModal.tsx';
import { MaterialPreviewModal } from './components/materials/MaterialPreviewModal.tsx';
import { ClassesView } from './components/classes/ClassesView.tsx';
import { ClassModal } from './components/classes/ClassModal.tsx';
import { ClassDetailModal } from './components/classes/ClassDetailModal.tsx';
import { SubjectsView } from './components/subjects/SubjectsView.tsx';
import { StudentsView } from './components/students/StudentsView.tsx';
import { StudentModal } from './components/students/StudentModal.tsx';
import { StudentProfileModal } from './components/students/StudentProfileModal.tsx';
import { AttendanceSheetModal } from './components/attendance/AttendanceSheetModal.tsx';
import { GradebookView } from './components/grades/GradebookView.tsx';
import { TeachersView } from './components/teachers/TeachersView.tsx';
import { ParentPortalView } from './components/parent-portal/ParentPortalView.tsx';
import { AiTeachingAssistant } from './components/ai-assistant/AiTeachingAssistant.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { AutoUpdateToast } from './components/layout/AutoUpdateToast.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { ShareAppModal } from './components/share/ShareAppModal.tsx';
import { ClassRoom, Student, Material, ClassSession } from './types/index.ts';

function MainApp() {
  const {
    currentUser,
    activeTab,
    selectedStudentId,
    setSelectedStudentId,
    selectedClassId,
    setSelectedClassId,
    isShareModalOpen,
    setIsShareModalOpen,
  } = useApp();

  // Login Modal state for in-app switching
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Modals state
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceClassId, setAttendanceClassId] = useState<string | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [detailClass, setDetailClass] = useState<ClassRoom | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);

  // Material modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialPresets, setMaterialPresets] = useState<MaterialModalPresets | undefined>(undefined);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Session & Reminder modals
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);

  // Handlers
  const handleOpenAttendance = (classId?: string) => {
    setAttendanceClassId(classId || null);
    setIsAttendanceModalOpen(true);
  };

  const handleOpenNewClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls?: ClassRoom) => {
    setEditingClass(cls || null);
    setIsClassModalOpen(true);
  };

  const handleOpenClassDetail = (cls: ClassRoom) => {
    setDetailClass(cls);
    setIsClassDetailModalOpen(true);
  };

  const handleOpenNewStudent = () => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (st?: Student) => {
    setEditingStudent(st || null);
    setIsStudentModalOpen(true);
  };

  const handleOpenStudentProfile = (studentId?: string) => {
    if (!studentId) return;
    setProfileStudentId(studentId);
    setIsProfileModalOpen(true);
  };

  const handleOpenUploadMaterial = (mat?: Material, presets?: MaterialModalPresets) => {
    setEditingMaterial(mat || null);
    setMaterialPresets(presets);
    setIsMaterialModalOpen(true);
  };

  const handleOpenPreviewMaterial = (mat: Material) => {
    setPreviewMaterial(mat);
    setIsPreviewModalOpen(true);
  };

  const handleOpenNewSession = (session?: ClassSession) => {
    setEditingSession(session || null);
    setIsSessionModalOpen(true);
  };

  if (!currentUser) {
    return <LoginView onSuccess={() => setIsLoginModalOpen(false)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <Sidebar onOpenLogin={() => setIsLoginModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenQuickAttendance={() => handleOpenAttendance()}
          onOpenNewStudent={handleOpenNewStudent}
          onOpenNewClass={handleOpenNewClass}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* View Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenAttendanceModal={handleOpenAttendance}
                onOpenStudentModal={handleOpenStudentProfile}
              />
            )}

            {activeTab === 'timetable' && (
              <TimetableMatrixView
                onOpenNewClass={handleOpenNewClass}
                onOpenAttendanceModal={handleOpenAttendance}
              />
            )}

            {activeTab === 'schedule_reminders' && (
              <ScheduleReminderView
                onOpenNewSessionModal={handleOpenNewSession}
                onOpenAttendanceModal={handleOpenAttendance}
              />
            )}

            {activeTab === 'materials' && (
              <MaterialsView
                onOpenUploadModal={handleOpenUploadMaterial}
                onOpenPreviewModal={handleOpenPreviewMaterial}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesView
                onOpenClassModal={handleOpenEditClass}
                onOpenAttendanceModal={handleOpenAttendance}
                onOpenClassDetailModal={handleOpenClassDetail}
              />
            )}

            {activeTab === 'subjects' && <SubjectsView />}

            {activeTab === 'students' && (
              <StudentsView
                onOpenStudentModal={handleOpenEditStudent}
                onOpenProfileModal={handleOpenStudentProfile}
              />
            )}

            {activeTab === 'grades' && <GradebookView />}

            {activeTab === 'teachers' && <TeachersView />}

            {activeTab === 'parent_portal' && <ParentPortalView />}

            {activeTab === 'ai_assistant' && <AiTeachingAssistant />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <AttendanceSheetModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        defaultClassId={attendanceClassId}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        editingClass={editingClass}
      />

      <ClassDetailModal
        isOpen={isClassDetailModalOpen}
        onClose={() => setIsClassDetailModalOpen(false)}
        cls={detailClass}
        onOpenAttendanceModal={handleOpenAttendance}
        onOpenStudentDetailModal={handleOpenStudentProfile}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        editingStudent={editingStudent}
      />

      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        studentId={profileStudentId}
      />

      <MaterialModal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setMaterialPresets(undefined);
        }}
        editingMaterial={editingMaterial}
        presets={materialPresets}
      />

      <MaterialPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        material={previewMaterial}
      />

      <NewSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        editingSession={editingSession}
      />

      {/* Floating Auto-Update Feedback Toast */}
      <AutoUpdateToast />

      {/* In-App Login & Switch Account Modal */}
      {isLoginModalOpen && (
        <LoginView
          isModal
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Share App Modal (Chia Sẻ App Cho Mọi Người Xem) */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
