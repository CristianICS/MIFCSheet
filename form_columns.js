
// Important: The order of appearance will be the same as the order in the application rows.
var inv_columns = {
    'plot_type': {
        'custom_name': "Plot type",
        'description': 'Type of plot.',
        'values': ['LTP', 'STP'],
        'meanings': ['Large Tree Plot (11.28m radius plot, tree dbh minimum 9cm)', 'Small Tree Plot (3.99m radius plot, tree dbh minimum 9cm)'],
        'form_type': 'select'
    },
    'genus': {
        'custom_name': "Genus",
        'description': 'Genus of the inventoried species. If you want to add a genus that is not in the list, you should define a custom N value or leave the column empty.',
        'form_type': 'input',
        'input_type': 'text',
        'autocomplete': true,
        'autocomplete_code': true,
        'autocomplete_code_column': 'n'
    },
    'n': {
        'custom_name': "N",
        'description': 'Code related to the Genus of the species.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'integer',
        'autocomplete_code': true,
        'autocomplete_value': 'genus'
    },
    'quadrant': {
        'custom_name': "Quadrant",
        'description': 'Transect in which the ground plot is divided.',
        'values': ['NE', 'SE', 'SW', 'NW'],
        'meanings': ['Northeast', 'Southeast', 'Southwest', 'Northwest'],
        'form_type': 'select'
    },
    'tree_status': {
        'custom_name': "Tree status",
        'description': '',
        'values': ['LS', 'LF', 'DS'],
        'meanings': ['Live Standing', 'Live Fallen', 'Dead Standing'],
        'form_type': 'select'
    },
    'tree_height_type': {
        'custom_name': "Tree height (type)",
        'description': 'was the tree calculated, or estimated?',
        'values': ['Calculated', 'Estimated'],
        'meanings': ['Using clinometer or another instrument.', 'Make an estimate by comparing it with another element.'],
        'form_type': 'select'
    },
    'crown_class': {
        'custom_name': "Crown class",
        'description': 'Refers to the tree crown position in relation to other trees in the immediate area.',
        'values': ['Dominant', 'Co-dominant', 'Intermediate', 'Suppressed', 'Veteran', 'Not Applicable', 'Missing'],
        'meanings': [
            'Trees with crowns that extend above the general level of the trees immediately around them. The most extensive and full light from above than the co-dominant trees, and receive some light from the sides; generally larger than average trees in the stand, and have well-developed crowns.',
            'Trees with crowns forming the general level of the crown canopy and receiving full light from above but little light from the sides; usually medium-sized trees more or less crowded on the sides, receiving full light from above but little from the sides.',
            'Trees shorter than those in two preceding classes, but extending into lower portion of crown canopy (may include trees, shrubs, or other obstructions) immediately around them; receive little direct sunlight except on uppermost branches; usually small and quite crowded on all sides by neighboring tree crowns.',
            'Trees with crowns entirely below general level of crown canopy formed by dominant trees, shrubs or other obstructions that form a distinct layer of foliage above them; receive no direct sunlight at all.',
            'Mature trees that are considerably older than rest of stand (or even-aged stands); often have large spreading branches near top which may be broken off due to age or weather damage; may show signs indicating they were harvested when young such as scars left behind where branches were removed during thinning operations years ago before being harvested again later when they reached maturity stage after having survived through growth cycles over time until reaching current state today despite being much older compared younger counterparts within same area now considered veterans due their age which is greater than average age within same forest area (Dunster and Dunster 1996).',
            'When crown class measurement is not applicable (e.g., trees with no measurable live crown such as individual stems without living crown standing dead trees fallen live leaves)',
            ''],
            'form_type': 'select'
        },
    'crown_condition': {
        'custom_name': "Crown condition",
        'description': 'A measure of the condition of the crown in relation to a normal live crown.',
        'values': [1, 2, 3, 4, 5, 6],
        'meanings': [
            'All foliage, twigs, and branches present',
            'Some or all foliage lost, possibly some twigs lost, all branches present',
            'Not foliage, up to 50% of twigs lost, most branches present',
            'Not foliage or twigs, up to 50% branches lost',
            'Not foliage or twigs. Some sound and rotting branch stubs may be present.',
            'Not foliage, twigs, branches, or branch stubs.'
        ],
        'form_type': 'select'
    },
    'tree_number': {
        'custom_name': "Tree number",
        'description': 'Relative ID of each tree inside the plot. Defined by the user.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'integer'
    },
    'dbh_cm': {
        'custom_name': "DBH (cm)",
        'description': 'Dimension at Brest Height, measured in centimeters at 1.20m of height.',
        'form_type': 'input',
        'input_type': 'number',
        'number_type': 'float'
    },
    'tree_height_m': {
        'custom_name': "Tree height (m)",
        'description': 'Tree heights measured in meters.',
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