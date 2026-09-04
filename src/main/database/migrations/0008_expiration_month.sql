-- El vencimiento se administra por mes. Para los registros existentes se
-- conserva el año y mes y solamente se elimina el día.
UPDATE medicamentos
SET fecha_vencimiento = substr(fecha_vencimiento, 1, 7)
WHERE fecha_vencimiento GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';

UPDATE biomedical_supplies
SET expiration_date = substr(expiration_date, 1, 7)
WHERE expiration_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';
