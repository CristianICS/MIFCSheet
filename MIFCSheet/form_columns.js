
// Important: The order of appearance will be the same as the order in the application rows.
var inv_columns = {
    'species': {
        'custom_name': "Species",
        'description': 'Inventoried species. If you want to add a species that is not in the list, you should define a custom N value or leave the column empty.',
        'form_type': 'input',
        'input_type': 'text',
        'autocomplete': true,
        'autocomplete_code': true,
        'autocomplete_code_column': 'n'
    },
    'n': {
        'custom_name': "N",
        'description': 'Code related to the species name.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'integer',
        'autocomplete_code': true,
        'autocomplete_value': 'species'
    },
    'd': {
        'custom_name': "D",
        'description': 'Distance from the init of the central metric type to the measured species.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'dl': {
        'custom_name': "dl",
        'description': 'Distance from central metric type to the measured species (left).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'dr': {
        'custom_name': "dr",
        'description': 'Distance from central metric type to the measured species (right).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'h': {
        'custom_name': "h",
        'description': 'Tree height (meters).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'dma': {
        'custom_name': "Dma",
        'description': 'Major diameter (DBH < 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'dmi': {
        'custom_name': "Dmi",
        'description': 'Minor diameter (DBH < 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'rma': {
        'custom_name': "Rma",
        'description': 'Mayor radius (DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'rmi': {
        'custom_name': "Rmi",
        'description': 'Minor radius (DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'dbh_cm': {
        'custom_name': "DBH",
        'description': 'Distance to Breast Height (DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'comment': {
        'custom_name': "Comments",
        'description': 'Row comments.',
        'form_type': 'input',
        'input_type': 'text'
    }
}