/**
 * Extrai o nome do banco de dados ou o nome do arquivo de uma URL de conexão de banco de dados.
 * @param url A URL do banco de dados (ex: postgresql://user@host/dbname, sqlite:///path/to/file.db)
 * @returns O nome do banco de dados ou uma string formatada do caminho.
 */
export const extractDbName = (url: string): string => {
  try {
    // Para URLs padrão como postgresql, mysql, etc.
    const urlObject = new URL(url);
    const dbName = urlObject.pathname.substring(1); // Remove o '/' inicial
    if (dbName) {
      return dbName;
    }
  } catch (e) {
    // Lida com URLs que não são padrão, como caminhos de arquivo do SQLite
    const sqliteMatch = url.match(/sqlite:\/\/\/(.+)/);
    if (sqliteMatch && sqliteMatch[1]) {
      const pathParts = sqliteMatch[1].split('/');
      return pathParts[pathParts.length - 1] || 'SQLite DB';
    }
  }
  
  // Fallback para qualquer outro caso
  return 'Banco de Dados';
};
