import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockSubmit} from '../mock-api.js';
import {validateAppointment} from '../validation.js';

const valid={fullName:'Иванов Иван Иванович',phone:'+7 (999) 123-45-67',consent:true};
test('required fields and consent are validated independently',()=>{
 assert.deepEqual(Object.keys(validateAppointment({fullName:' ',phone:'',consent:false})),['fullName','phone','consent']);
 assert.deepEqual(validateAppointment(valid),{});
});
test('phone formats accept RU prefixes and reject truncated, foreign, or alphabetic values',()=>{
 for(const phone of ['+7 (999) 123-45-67','89991234567','9991234567']) assert.deepEqual(validateAppointment({...valid,phone}),{});
 for(const phone of ['+7','+7999123456','19991234567','+7abc9991234567','7+9991234567']) assert.ok(validateAppointment({...valid,phone}).phone);
});
test('name validation accepts compound names and rejects digits',()=>{
 assert.deepEqual(validateAppointment({...valid,fullName:'Анна-Мария Петрова'}),{});
 assert.ok(validateAppointment({...valid,fullName:'12345'}).fullName);
});
test('default demo fails once, then succeeds without mutating payload',async()=>{
 const submit=createMockSubmit({delay:0});
 const payload=Object.freeze({...valid});
 await assert.rejects(submit(payload),/Демонстрационная ошибка/);
 assert.deepEqual(await submit(payload),{demo:true,message:'Демонстрация завершена успешно. Заявка в клинику не отправлялась.'});
});
test('adapter can simulate persistent failure and immediate success',async()=>{
 await assert.rejects(createMockSubmit({delay:0,outcome:'error'})(valid));
 assert.equal((await createMockSubmit({delay:0,outcome:'success'})(valid)).demo,true);
});
