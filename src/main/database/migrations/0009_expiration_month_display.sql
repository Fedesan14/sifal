-- Presentar y editar el vencimiento con el formato mes/año usado por el usuario.
UPDATE medicamentos
SET fecha_vencimiento = substr(fecha_vencimiento, 6, 2) || '/' || substr(fecha_vencimiento, 1, 4)
WHERE fecha_vencimiento GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]';

UPDATE biomedical_supplies
SET expiration_date = substr(expiration_date, 6, 2) || '/' || substr(expiration_date, 1, 4)
WHERE expiration_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]';
