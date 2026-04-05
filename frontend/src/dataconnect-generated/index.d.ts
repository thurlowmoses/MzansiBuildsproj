import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface Follow_Key {
  followerId: UUIDString;
  followeeId: UUIDString;
  __typename?: 'Follow_Key';
}

export interface GetPublicProjectsData {
  projects: ({
    id: UUIDString;
    name: string;
    description: string;
    liveDemoUrl?: string | null;
    githubRepoUrl?: string | null;
    technologiesUsed?: string[] | null;
    user?: {
      id: UUIDString;
      displayName: string;
      username: string;
    } & User_Key;
  } & Project_Key)[];
}

export interface Like_Key {
  userId: UUIDString;
  projectUpdateId: UUIDString;
  __typename?: 'Like_Key';
}

export interface ProjectUpdate_Key {
  id: UUIDString;
  __typename?: 'ProjectUpdate_Key';
}

export interface Project_Key {
  id: UUIDString;
  __typename?: 'Project_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface GetPublicProjectsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicProjectsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicProjectsData, undefined>;
  operationName: string;
}
export const getPublicProjectsRef: GetPublicProjectsRef;

export function getPublicProjects(options?: ExecuteQueryOptions): QueryPromise<GetPublicProjectsData, undefined>;
export function getPublicProjects(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetPublicProjectsData, undefined>;

