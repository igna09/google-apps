Date.prototype.getTwoDigitValueString = (value) => value > 9 ? value.toString() : '0' + value;
      Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    return local.getFullYear() + '-' + this.getTwoDigitValueString(local.getMonth() + 1) + '-' + this.getTwoDigitValueString(local.getDate());
});
let spese = [];
let categorie = [];
let table;
// Mostra i dati dal foglio di calcolo nel form
window.onload = function() {
  if (window.datiDalFoglio) {
    spese = window.datiDalFoglio.spese.map((e, i) => ({
      data: e[0] ? (new Date(e[0])).toDateInputValue() : undefined, 
      descrizione: e[1], 
      categoria: e[2], 
      importo: e[3], 
      nota: e[4]
    }));

    const columns = [
      {label: 'Data', sort: 'asc', property: 'data', renderingFunction: (rowObject) => {
        /*if(rowObject.data.editMode) {
          const input = document.createElement('input');
          input.type = 'date';
          input.value = rowObject.data.rawData.data;
          input.onchange = (e) => {
            rowObject.data.rawData.data = e.target.value;
            //rowObject.apis.update();
          }
          return input
        } else {*/
          const container = document.createElement('div');
          container.innerText = rowObject.data.rawData.data ? rowObject.data.rawData.data : '';
          return container;
        //}
      }}, 
      {label: 'Descrizione', property: 'descrizione'}, 
      {label: 'Categoria', sort: 'none', property: 'categoria'}, 
      {label: 'Importo', sort: 'none', property: 'importo', renderingFunction: (rowObject) => {
        const container = document.createElement('div');
        container.innerHTML = rowObject.data.rawData.importo + ' &euro;';
        return container;
      }}, 
      {label: 'Nota', property: 'nota', /*renderingFunction: (rowObject) => {
        if(rowObject.data.editMode) {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = rowObject.data.rawData.nota;
          input.onchange = (e) => {
            rowObject.data.rawData.nota = e.target.value;
            //rowObject.apis.update();
          }
          return input
        } else {
          const label = document.createElement('label');
          label.innerText = rowObject.data.rawData.nota;
          return label;
        }
      }*/},
    ];
    table = createTable(columns, (rowObject) => openDialog(rowObject));
    document.getElementsByTagName('body')[0].appendChild(table.element);
    table.apis.addRows(spese);
    //console.log(table, table.apis.getData())
    updateCategorie(table.apis.getData());
  }
};

function createButton(label, callback) {
  const button = document.createElement('button');
  button.innerHTML = label;
  button.onclick = callback;
  return button;
}

const sortings = [{id: 'none', symbol: '&#8597;', usable: false},{id: 'asc', symbol: '&#8593;', usable: true},{id: 'desc', symbol: '&#8595;', usable: true}];

function createTable(columnsToShow, onClickRow) {
  const tableObject = {
    element: document.createElement('table'),
    data: {value: [], intestazione: undefined, columns: columnsToShow, sorting: {sort: 'asc', property: columnsToShow[0].property}, onClickRow},
    apis: {
      createIntestazioneRow: () => {
        const intestazioneRowObject = {
          element: document.createElement('tr'),
          data: {value: []},
          apis: {
            createIntestazioneColumn: (columnObject) => {
              const intestazioneColumnObject = {
                element: document.createElement('th'),
                data: {value: columnObject.label, sorting: {sort: columnObject.sort, property: columnObject.property}},
                apis: {
                  update: () => {
                    //console.log('column intestazione render', intestazioneColumnObject)
                    let label = intestazioneColumnObject.data.value;
                    if(intestazioneColumnObject.data.sorting !== undefined && sortings.findIndex(e => e.id === intestazioneColumnObject.data.sorting.sort) !== -1) {
                      label += ' ' + sortings.find(e => e.id === intestazioneColumnObject.data.sorting.sort).symbol;
                    }
                    intestazioneColumnObject.element.innerHTML = label;
                    return intestazioneColumnObject.element;
                  }
                }
              }
              if(columnObject.sort !== undefined) {
                intestazioneColumnObject.element.style = 'cursor: pointer';
                intestazioneColumnObject.element.onclick = () => {
                  intestazioneRowObject.data.value.filter(e => e.data.sorting !== undefined && e.data.sorting.sort !== undefined && e != intestazioneColumnObject).forEach(e => e.data.sorting = {...e.data.sorting, sort: 'none'});
                  do {
                    intestazioneColumnObject.data.sorting = {...intestazioneColumnObject.data.sorting, sort: sortings[(sortings.findIndex(e => e.id === intestazioneColumnObject.data.sorting.sort) + 1) % sortings.length].id};
                  } while (!sortings.find(e => e.id === intestazioneColumnObject.data.sorting.sort).usable)
                  tableObject.data.sorting = intestazioneColumnObject.data.sorting;

                  //console.log('intestazioneClick', intestazioneColumnObject);
                  tableObject.apis.update();
                }
              }
              intestazioneColumnObject.element.innerText = intestazioneColumnObject.data.value;
              return intestazioneColumnObject;
            },
            update: () => {
              //console.log('intestazione row render')
              intestazioneRowObject.data.value.forEach(c => {
                //console.log('rowObject render forEach', c)
                c.apis.update();
              });
              return intestazioneRowObject.element;
            }
          }
        }

        tableObject.data.columns.forEach(c => {
          //console.log('tableObject createRow forEach', c)
          const columnObject = intestazioneRowObject.apis.createIntestazioneColumn({label: c.label, property: c.property, sort: c.sort});
          intestazioneRowObject.data.value.push(columnObject);
          intestazioneRowObject.element.appendChild(columnObject.element);
        });

        return intestazioneRowObject;
      },
      createRow: (rowData) => {
        const rowObject = {
          element: document.createElement('tr'),
          data: {rawData: rowData, value: [], index: undefined},
          apis: {
            updateValue: (index, newValue) => {
              rowObject.data.value[index].apis.updateValue(newValue);
            }, 
            createColumn: (value, property) => {
              const columnObject = {
                element: document.createElement('td'),
                data: {value, property},
                apis: {
                  updateValue: (newValue) => {
                    //TODO: riconciliare con funzioni
                    columnObject.element.innerHTML = newValue;
                    columnObject.data.value = newValue;
                  },
                  update: () => {
                    //console.log('column render')
                    if(typeof columnObject.data.value === 'function') {
                      columnObject.element.innerHTML = '';
                      columnObject.element.appendChild(columnObject.data.value(rowObject));
                    } else {
                      columnObject.data.value = rowObject.data.rawData[columnObject.data.property];
                      columnObject.element.innerHTML = columnObject.data.value;
                    }
                    return columnObject.element;
                  }
                }
              }
              return columnObject
            },
            update: () => {
              //console.log('row render', rowObject)
              rowObject.data.value.forEach(columnObject => {
                //console.log('rowObject render forEach', c)
                columnObject.apis.update();
              });
              return rowObject.element;
            }
          }
        };

        if(tableObject.data.onClickRow) {
          rowObject.element.onclick = () => tableObject.data.onClickRow(rowObject);
          rowObject.element.style = 'cursor: pointer';
        }

        tableObject.data.columns.forEach(c => {
          //console.log('tableObject createRow forEach', c)
          const columnObject = rowObject.apis.createColumn(c.renderingFunction ? c.renderingFunction : rowData[c.property], c.property);
          rowObject.data.value.push(columnObject);
          rowObject.element.appendChild(columnObject.element);
        });
        
        return rowObject;
      },
      update: () => {
        //console.log('table render')
        tableObject.data.value.sort((a, b) => {
          //console.log(a,b)

          //const property = tableObject.data.columns.find(c => c.sort !== undefined);
          const sortingObject = tableObject.data.sorting;
          //console.log(sortingObject)

          let first;
          let second;

          if(sortingObject.sort === 'asc') {
            first = a.data.rawData[sortingObject.property];
            second = b.data.rawData[sortingObject.property];
          } else if(sortingObject.sort === 'desc') {
            first = b.data.rawData[sortingObject.property];
            second = a.data.rawData[sortingObject.property];
          }

          // Se a o b sono undefined, mettili alla fine
          if (first === undefined || first === '') return 1;
          if (second === undefined || second === '') return -1;
          
          // Altrimenti confronta le date
          if(first < second) {
            return -1;
          } else if(first > second) {
            return 1;
          } else {
            return 0;
          }
        });
        tableObject.element.innerHTML = '';
        tableObject.element.appendChild(tableObject.data.intestazione.element);
        tableObject.data.intestazione.apis.update();
        tableObject.data.value.forEach((rowObject, index) => {
          rowObject.data.index = index;
          rowObject.apis.update();
          tableObject.element.appendChild(rowObject.element);
        });
      },
      addRows: (rows) => {
        rows.forEach((rowData, index) => {
          const row = tableObject.apis.createRow(rowData);
          // console.log(row)
          tableObject.data.value.push(row);
          tableObject.element.appendChild(row.element);
        });
        tableObject.apis.update();
      },
      getRow: (index) => value[index],
      removeRow: (index) => {
        tableObject.data.value.splice(index, 1)
        tableObject.apis.update();
      },
      getData: () => tableObject.data.value.map(e => e.data.rawData),
      /*sort: () => console.log('table sort'),
      render: () => {
        tableObject.element.innerHTML = '';

        tableObject.data.intestazione = tableObject.apis.createIntestazioneRow();
        tableObject.element.appendChild(tableObject.data.intestazione.element);
      }*/
    }
  };

  tableObject.data.intestazione = tableObject.apis.createIntestazioneRow();
  tableObject.element.appendChild(tableObject.data.intestazione.element);
  
  return tableObject;
}

const categorieDatalist = document.getElementById('categorie');

function updateCategorie(spese) {
  categorieUniche = [...new Set(spese.map(e=>e.categoria))].filter(c => c !== "");  // Rimuove valori vuoti
  // Aggiungi le categorie uniche all'elemento datalist
  rimuoviContenutoComponente(categorieDatalist);
  categorieUniche.forEach(categoria => {
    const option = document.createElement('option');
    option.value = categoria;
    categorieDatalist.appendChild(option);
  });
}

function rimuoviContenutoComponente(componente) {
  componente.innerHTML = '';
}

const buttonContainer = document.getElementsByClassName('button-container')[0];
const salvaButton = buttonContainer.querySelector('#submitButton');
const eliminaButton = buttonContainer.querySelector('#elimina');

eliminaButton.onclick = () => {
  table.apis.removeRow(aggiornaDatiRow.data.index);
  updateCategorie(table.apis.getData());
  closeDialog();
  aggiornaDatiRow = undefined;
  saveOnGoogle();
}

salvaButton.onclick = aggiungiSpesa;

let aggiornaDatiRow = undefined;
const openDialog = (rowObject) => {
  if(rowObject) {
    aggiornaDatiRow = rowObject;
    if(rowObject.data.rawData.data) {
      document.getElementById('data').value = rowObject.data.rawData.data;
      document.getElementById('spesaFutura').checked = false;
    } else {
      document.getElementById('spesaFutura').checked = true;
    }
    document.getElementById('descrizione').value = rowObject.data.rawData.descrizione;
    document.getElementById('categoria').value = rowObject.data.rawData.categoria;
    document.getElementById('importo').value = rowObject.data.rawData.importo;
    document.getElementById('nota').value = rowObject.data.rawData.nota;

    eliminaButton.style.display = 'block';
  } else {
    eliminaButton.style.display = 'none';
  }
  modalOverlay.style.display = 'block';
}

const closeDialog = () => {
  modalOverlay.style.display = 'none';
  form.reset();
}

const floatBtn = document.getElementById('float-btn');
const modal = document.getElementById('modal');
const modalOverlay = document.getElementById('modal-overlay');
const closeModal = document.getElementById('close-modal');

floatBtn.addEventListener('click', function() {
    console.log('click floatBtn')
    openDialog();
});

closeModal.addEventListener('click', function() {
  closeDialog();
});

modalOverlay.addEventListener('click', function() {
  if (!modal.contains(event.target)) {
    closeDialog();
  }
});

const form = document.getElementById('formDati');
const submitButton = document.getElementById('submitButton');
const campoData = document.getElementById('data');

// Abilita/disabilita il pulsante in base alla validità del form
form.addEventListener('input', () => {
  submitButton.disabled = !form.checkValidity();
});

function gestisciData() {
  const spesaFutura = document.getElementById('spesaFutura').checked;
  
  if (spesaFutura) {
    // Disabilita il campo data e rimuove l'obbligatorietà
    campoData.disabled = true;
    campoData.removeAttribute('required');
    
    // Resetta il valore del campo data
    campoData.value = '';
  } else {
    // Abilita il campo data e lo rende obbligatorio
    campoData.disabled = false;
    campoData.setAttribute('required', 'true');
  }

  // Controlla di nuovo la validità del form
  form.dispatchEvent(new Event('input'));
}

function aggiungiSpesa() {
  if(aggiornaDatiRow !== undefined) {
    aggiornaDatiRow.data.rawData.data= !document.getElementById('spesaFutura').checked ? new Date(document.getElementById('data').value).toDateInputValue() : undefined,
    aggiornaDatiRow.data.rawData.descrizione = document.getElementById('descrizione').value,
    aggiornaDatiRow.data.rawData.categoria = document.getElementById('categoria').value,
    aggiornaDatiRow.data.rawData.importo = parseFloat(document.getElementById('importo').value),
    aggiornaDatiRow.data.rawData.nota = document.getElementById('nota').value || '' // Nota opzionale, usa stringa vuota se assente
    aggiornaDatiRow.apis.update();
    aggiornaDatiRow = undefined;
  } else {
    const dati = {
      data: !document.getElementById('spesaFutura').checked ? new Date(document.getElementById('data').value).toDateInputValue() : undefined,
      // spesaFutura: document.getElementById('spesaFutura').checked,
      descrizione: document.getElementById('descrizione').value,
      categoria: document.getElementById('categoria').value,
      importo: parseFloat(document.getElementById('importo').value),
      nota: document.getElementById('nota').value || '' // Nota opzionale, usa stringa vuota se assente
    };
    table.apis.addRows([dati]);
  }
  closeDialog();
  updateCategorie(table.apis.getData());
  saveOnGoogle();
}

function sortSpese(spese) {
  const newSpese = [...spese];
  newSpese.sort((a,b) => {
    // Se a o b sono undefined, mettili alla fine
    if (a.data === undefined || a.data === '') return 1;
    if (b.data === undefined || b.data === '') return -1;
    
    // Altrimenti confronta le date
    if(a.data < b.data) {
      return -1;
    } else if(a.data > b.data) {
      return 1;
    } else {
      return 0;
    }
  })
  return newSpese;
}

function saveOnGoogle() {
  //console.log(sortSpese(table.apis.getData().map(e => ({...e, data: e.data ? e.data : undefined}))))
  google.script.run.aggiornaSpese(sortSpese(table.apis.getData().map(e => ({...e, data: e.data ? e.data : undefined}))));
}