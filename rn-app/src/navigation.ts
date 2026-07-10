export type RootStackParamList = {
  Login: undefined;
  Courses: undefined;
  CourseDetail: { courseId: string; courseTitle: string };
  Topic: { courseId: string; topicId: string; topicTitle: string };
};
