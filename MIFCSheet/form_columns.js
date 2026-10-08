
// Inventory type. Enables MIFC-specific features (transect preview). Remove it for other inventory types.
var inv_type = "MIFC";

// Important: The order of appearance will be the same as the order in the application rows.
var inv_columns = {
    'species': {
        'custom_name': "Species",
        'description': 'Inventoried species. If you want to add a species that is not in the list, you should define a custom N value or leave the column empty.',
        'form_type': 'input',
        'input_type': 'text',
        'autocomplete': {
            'source': 'species.csv',
            'value': 'name',
            'fill': {
                'n': 'code'
            }
        },
    },
    'n': {
        'custom_name': "N",
        'description': 'Code related to the species name.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'integer',
        'autocomplete': {
            'source': 'species.csv',
            'value': 'code',
            'fill': {
                'species': 'name'
            }
        }
    },
    'd': {
        'custom_name': "D",
        'description': 'Distance from the init of the central measuring tape to the measured species (centimeters).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 1000
    },
    'dl': {
        'custom_name': "dl",
        'description': 'Distance from central measuring tape to the measured species (left, centimeters).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 100
    },
    'dr': {
        'custom_name': "dr",
        'description': 'Distance from central measuring tape to the measured species (right, centimeters).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 100
    },
    'h': {
        'custom_name': "h",
        'description': 'Plant height (centimeters).',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 5000
    },
    'dma': {
        'custom_name': "Dma",
        'description': 'Major diameter (DBH < 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 500
    },
    'dmi': {
        'custom_name': "Dmi",
        'description': 'Minor diameter (DBH < 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 500
    },
    'rma': {
        'custom_name': "Rma",
        'description': 'Mayor radius (DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 250
    },
    'rmi': {
        'custom_name': "Rmi",
        'description': 'Minor radius (DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 250
    },
    'dbh_cm': {
        'custom_name': "DBH",
        'description': 'Diameter at Breast Height (centimeters, DBH >= 2cm)',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float',
        'min': 0,
        'max': 500
    },
    'comment': {
        'custom_name': "Comments",
        'description': 'Row comments.',
        'form_type': 'input',
        'input_type': 'text'
    }
}