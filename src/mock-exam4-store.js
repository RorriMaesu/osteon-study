import {blankMockState,validMockState,readMockState,writeMockState,mockBackup,parseMockBackup} from './mock-exam3-store.js';
import {mockExam4Questions} from './mock-exam4-bank.js';
export const MOCK_EXAM4_STORAGE_KEY='osteon-mock-exam4-v1';
const options={bank:mockExam4Questions,key:MOCK_EXAM4_STORAGE_KEY,kind:'osteon-exam4-backup'};
export const mockExam4Storage={
 blank:blankMockState,
 read:storage=>readMockState(storage,options),
 write:(storage,state)=>writeMockState(storage,state,options),
 backup:state=>mockBackup(state,Date.now(),options),
 restore:backup=>parseMockBackup(backup,options),
 key:MOCK_EXAM4_STORAGE_KEY,
};
export const validMockExam4State=state=>validMockState(state,mockExam4Questions);
