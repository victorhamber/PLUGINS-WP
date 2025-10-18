import { pool } from '../server/db.js';

async function testRevenueQuery() {
  try {
    console.log('Testando query de revenue...');
    
    // Primeiro, vamos ver se há dados na tabela
    const countResult = await pool.query('SELECT COUNT(*) as total FROM subscriptions');
    console.log(`Total de subscriptions: ${countResult.rows[0].total}`);
    
    // Testar a query problemática
    const query = `
      SELECT 
        DATE(created_at) as period,
        SUM(price) as revenue,
        COUNT(*) as subscriptions
      FROM subscriptions 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY period DESC
    `;
    
    console.log('Executando query:', query);
    const result = await pool.query(query);
    console.log('Resultado:', result.rows);
    
  } catch (error) {
    console.error('Erro na query:', error);
    
    // Vamos tentar uma versão mais simples
    try {
      console.log('\nTentando query simplificada...');
      const simpleQuery = `
        SELECT 
          created_at::date as period,
          SUM(price) as revenue,
          COUNT(*) as subscriptions
        FROM subscriptions 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY created_at::date
        ORDER BY period DESC
      `;
      
      const simpleResult = await pool.query(simpleQuery);
      console.log('Resultado da query simplificada:', simpleResult.rows);
    } catch (simpleError) {
      console.error('Erro na query simplificada:', simpleError);
    }
  } finally {
    await pool.end();
  }
}

testRevenueQuery();