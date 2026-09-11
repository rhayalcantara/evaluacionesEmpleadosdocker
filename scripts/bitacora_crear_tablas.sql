-- Fase 3 — Bitácora de Eventos de Desempeño. Equivalente manual de la migración EF
-- AddBitacoraEventos, para aplicar en produccion sin `dotnet ef database update`.
-- Idempotente. Aplicado en Evaluaciones_Test el 2026-09-11.
SET NOCOUNT ON; SET XACT_ABORT ON;
BEGIN TRAN;
IF OBJECT_ID('dbo.BitacoraEvento') IS NULL
BEGIN
    CREATE TABLE dbo.BitacoraEvento (
        Id                      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BitacoraEvento PRIMARY KEY,
        EmpleadoSecuencial      INT            NOT NULL,
        RegistradoPorSecuencial INT            NOT NULL,
        FechaEvento             DATE           NOT NULL,
        FechaRegistro           DATETIME2      NOT NULL,
        FechaModificacion       DATETIME2      NULL,
        Tipo                    NVARCHAR(20)   NOT NULL,
        Impacto                 NVARCHAR(10)   NOT NULL,
        Descripcion             NVARCHAR(2000) NOT NULL,
        Activo                  BIT            NOT NULL CONSTRAINT DF_BitacoraEvento_Activo DEFAULT (1)
    );
    CREATE INDEX IX_BitacoraEvento_EmpleadoSecuencial_FechaEvento ON dbo.BitacoraEvento (EmpleadoSecuencial, FechaEvento);
    CREATE INDEX IX_BitacoraEvento_RegistradoPorSecuencial ON dbo.BitacoraEvento (RegistradoPorSecuencial);
END;
IF OBJECT_ID('dbo.BitacoraEventoCompetencia') IS NULL
BEGIN
    CREATE TABLE dbo.BitacoraEventoCompetencia (
        Id               INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_BitacoraEventoCompetencia PRIMARY KEY,
        BitacoraEventoId INT NOT NULL,
        ObjetivoId       INT NOT NULL,
        CONSTRAINT FK_BitacoraEventoCompetencia_BitacoraEvento_BitacoraEventoId
            FOREIGN KEY (BitacoraEventoId) REFERENCES dbo.BitacoraEvento (Id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IX_BitacoraEventoCompetencia_BitacoraEventoId_ObjetivoId
        ON dbo.BitacoraEventoCompetencia (BitacoraEventoId, ObjetivoId);
END;
COMMIT;
SELECT name FROM sys.tables WHERE name LIKE 'BitacoraEvento%';
