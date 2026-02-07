-- 독독 리브랜딩: 초대 코드 변경
-- chaekdam2026 비활성화, dokdok2026 추가

insert into invite_codes (code) values ('dokdok2026') on conflict do nothing;
delete from invite_codes where code = 'chaekdam2026';
