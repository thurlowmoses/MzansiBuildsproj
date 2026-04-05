import { GetPublicProjectsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetPublicProjects(options?: useDataConnectQueryOptions<GetPublicProjectsData>): UseDataConnectQueryResult<GetPublicProjectsData, undefined>;
export function useGetPublicProjects(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicProjectsData>): UseDataConnectQueryResult<GetPublicProjectsData, undefined>;
