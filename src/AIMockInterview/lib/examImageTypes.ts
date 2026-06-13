/** Stored in candidate_exam_images.type */
export const ExamImageType = {
  CANDIDATE_IMAGE: "CANDIDATE_IMAGE",
  CANDIDATE_EXAM_PROXY: "CANDIDATE_EXAM_PROXY",
  COPY_PASTE_VIOLATION: "COPY_PASTE_VIOLATION",
} as const;

export type ExamImageTypeValue =
  (typeof ExamImageType)[keyof typeof ExamImageType];

/** Stored in candidate_exam_images.violation_type (null for CANDIDATE_IMAGE). */
export enum ProctorViolationType {
  NO_FACE = "NO_FACE",
  MULTIPLE_FACES = "MULTIPLE_FACES",
  HEAD_TURN_LEFT = "HEAD_TURN_LEFT",
  HEAD_TURN_RIGHT = "HEAD_TURN_RIGHT",
  FACE_OFF_CENTER = "FACE_OFF_CENTER",
  FACE_TOO_FAR = "FACE_TOO_FAR",
  CAMERA_ERROR = "CAMERA_ERROR",
  COPY_PASTE = "COPY_PASTE",
}
