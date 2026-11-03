export function formatarDataParaEntrada(dataISO: string | null | undefined) {
  if (!dataISO) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

export function formatarEntradaData(valor: string, valorAnterior = '') {
  const indiceBarraRemovida = Array.from(valorAnterior).findIndex(
    (caractere, indice) =>
      caractere === '/' &&
      `${valorAnterior.slice(0, indice)}${valorAnterior.slice(indice + 1)}` === valor,
  );
  if (indiceBarraRemovida >= 0) {
    const digitosAntesDaBarra = valorAnterior.slice(0, indiceBarraRemovida).replace(/\D/g, '').length;
    const digitos = valorAnterior.replace(/\D/g, '');
    const indiceDigitoRemovido = digitosAntesDaBarra - 1;
    if (indiceDigitoRemovido >= 0) {
      return formatarDigitosData(
        digitos.slice(0, indiceDigitoRemovido) + digitos.slice(indiceDigitoRemovido + 1),
      );
    }
  }

  const dataISO = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (dataISO) return `${dataISO[3]}/${dataISO[2]}/${dataISO[1]}`;

  return formatarDigitosData(valor);
}

function formatarDigitosData(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos.length === 2 ? `${digitos}/` : digitos;
  if (digitos.length <= 4) {
    const dia = digitos.slice(0, 2);
    const mes = digitos.slice(2);
    return digitos.length === 4 ? `${dia}/${mes}/` : `${dia}/${mes}`;
  }
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export function converterDataParaISO(dataBR: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataBR);
  if (!match) return null;

  const [, diaTexto, mesTexto, anoTexto] = match;
  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);
  if (ano < 1 || mes < 1 || mes > 12 || dia < 1) return null;

  const ultimoDia = new Date(0);
  ultimoDia.setUTCFullYear(ano, mes, 0);
  if (dia > ultimoDia.getUTCDate()) return null;

  return `${anoTexto}-${mesTexto}-${diaTexto}`;
}

export function dataHojeBrasileira() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${hoje.getFullYear()}`;
}
