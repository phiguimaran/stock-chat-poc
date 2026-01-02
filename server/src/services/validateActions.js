import {
  suggestArticles,
  suggestDeposits,
  findArticleByCodeOrAlias,
  findDepositByCodeOrAlias
} from './lookup.js';

export async function validateActions(acciones) {
  const errores = [];

  for (let i = 0; i < acciones.length; i++) {
    const a = acciones[i];

    // cantidad
    if (a.cantidad == null || Number.isNaN(a.cantidad)) {
      errores.push({
        index: i,
        campo: 'cantidad',
        tipo: 'faltante',
        valor: null,
        sugerencias: []
      });
    } else if (a.cantidad <= 0) {
      errores.push({
        index: i,
        campo: 'cantidad',
        tipo: 'invalida',
        valor: String(a.cantidad),
        sugerencias: []
      });
    }

    // articulo
    if (!a.articulo) {
      const sug = await suggestArticles(null);
      errores.push({
        index: i,
        campo: 'articulo',
        tipo: 'faltante',
        valor: null,
        sugerencias: sug
      });
    } else {
      const found = await findArticleByCodeOrAlias(a.articulo);
      if (!found) {
        const sug = await suggestArticles(a.articulo);
        errores.push({
          index: i,
          campo: 'articulo',
          tipo: 'no_existe',
          valor: a.articulo,
          sugerencias: sug
        });
      } else {
        a.articulo = found.codigo;
      }
    }

    // deposito origen
    if (!a.deposito_origen) {
      const sug = await suggestDeposits(null);
      errores.push({
        index: i,
        campo: 'deposito_origen',
        tipo: 'faltante',
        valor: null,
        sugerencias: sug
      });
    } else {
      const found = await findDepositByCodeOrAlias(a.deposito_origen);
      if (!found) {
        const sug = await suggestDeposits(a.deposito_origen);
        errores.push({
          index: i,
          campo: 'deposito_origen',
          tipo: 'no_existe',
          valor: a.deposito_origen,
          sugerencias: sug
        });
      } else {
        a.deposito_origen = found.codigo;
      }
    }

    // deposito destino
    if (!a.deposito_destino) {
      const sug = await suggestDeposits(null);
      errores.push({
        index: i,
        campo: 'deposito_destino',
        tipo: 'faltante',
        valor: null,
        sugerencias: sug
      });
    } else {
      const found = await findDepositByCodeOrAlias(a.deposito_destino);
      if (!found) {
        const sug = await suggestDeposits(a.deposito_destino);
        errores.push({
          index: i,
          campo: 'deposito_destino',
          tipo: 'no_existe',
          valor: a.deposito_destino,
          sugerencias: sug
        });
      } else {
        a.deposito_destino = found.codigo;
      }
    }

    // origen == destino
    if (
      a.deposito_origen &&
      a.deposito_destino &&
      a.deposito_origen === a.deposito_destino
    ) {
      errores.push({
        index: i,
        campo: 'depositos',
        tipo: 'origen_igual_destino',
        valor: a.deposito_origen,
        sugerencias: []
      });
    }
  }

  return {
    ok: errores.length === 0,
    errores
  };
}

