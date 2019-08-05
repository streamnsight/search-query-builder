let queryStringParts = {};
let fieldTypes = {};
let queryString = '';
let command = ['FT.SEARCH', 'permits'];
let options = [];
let schema = [];

const limits = ['-inf', 'inf'];

const updateQueryString = fieldType => e => {
	console.log(fieldType);
	const field = e.target.name;
	const fieldId = e.target.id;
	const value = e.target.value;

	if (fieldType === 'NUMERIC') {
		const side = Number.parseInt(fieldId.split('__')[1]);
		const val = Number.parseInt(value) || limits[side];
		if (!queryStringParts[field]) {
			queryStringParts[field] = [...limits];
		}
		queryStringParts[field][side] = val;
		if (queryStringParts[field][0] === limits[0]
			&& queryStringParts[field][1] === limits[1]) {
			delete queryStringParts[field];
		}
	} else if (fieldType === 'TAG') {
		const values = [...e.target.selectedOptions].map(o => o.value);
		if (values.length === 0 || values[0] === '') {
			delete queryStringParts[field];
		} else {
			queryStringParts[field] = values;
		}
	} else {
		if (value === '') {
			delete queryStringParts[field];
		} else {
			queryStringParts[field] = value;
		}
	}
	const query = document.getElementById('query');

	queryString = '';
	Object.keys(queryStringParts).forEach(key => {
		if (fieldTypes[key] === 'TEXT') {
			queryString = `${queryString}@${key}: ${queryStringParts[key]} `
		} else if (fieldTypes[key] === 'TAG') {
			queryString = `${queryString}@${key}: {${queryStringParts[key].join(' | ')}} `
		} else if (fieldTypes[key] === 'NUMERIC') {
			queryString = `${queryString}@${key}: [${queryStringParts[key].join(', ')}] `
		}
	});
	queryString = `${queryString.trim()}`;
	query.textContent = `${command.join(' ')} "${queryString}" ${options.join(' ')}`;
};

const genTextField = field => {
	const element = document.createElement('div');
	const input = document.createElement('input');
	input.setAttribute('size', 30);
	input.setAttribute('type', 'text');
	input.setAttribute('name', field.name);
	input.setAttribute('id', field.name);
	input.addEventListener('keyup', updateQueryString(field.type));
	element.appendChild(addLabel(field));
	element.appendChild(input);
	return element;
};

const genNumericField = field => {
	const element = document.createElement('div');
	const min = document.createElement('input');
	min.setAttribute('size', 8);
	min.setAttribute('type', 'number');
	min.setAttribute('name', field.name);
	min.setAttribute('id', `${field.name}__0`);
	min.addEventListener('keyup', updateQueryString(field.type));
	const minLabel = document.createElement('label');
	minLabel.setAttribute('for', `${field.name}__0`);
	minLabel.textContent = 'from';
	const max = document.createElement('input');
	max.setAttribute('size', 8);
	max.setAttribute('type', 'number');
	max.setAttribute('name', field.name);
	max.setAttribute('id', `${field.name}__1`);
	max.addEventListener('keyup', updateQueryString(field.type));
	const maxLabel = document.createElement('label');
	maxLabel.setAttribute('for', `${field.name}__1`);
	maxLabel.textContent = 'to';
	element.appendChild(addLabel(field));
	element.appendChild(minLabel);
	element.appendChild(min);
	element.appendChild(maxLabel);
	element.appendChild(max);
	return element;
};

const genTagField = field => {
	const element = document.createElement('div');
	const select = document.createElement('select');
	select.setAttribute('multiple', true);
	select.setAttribute('name', field.name);
	select.setAttribute('id', field.name);
	select.addEventListener('change', updateQueryString(field.type));

	const optionEl = document.createElement('option');
	optionEl.setAttribute('value', '');
	optionEl.setAttribute('name', '');
	select.appendChild(optionEl);

	field.options.forEach(option => {
		const optionEl = document.createElement('option');
		optionEl.setAttribute('value', option);
		optionEl.setAttribute('name', option);
		optionEl.textContent = option;
		select.appendChild(optionEl);
	});
	element.appendChild(addLabel(field));
	element.appendChild(select);
	return element;
};

const optionsFields = {
	'HIGHLIGHT': false,
	'SUMMARIZE': false,
	'LIMIT': [0, 0]
};

const fieldMap = {
	'TEXT': genTextField,
	'NUMERIC': genNumericField,
	'TAG': genTagField,
};

// const genOptions = () => {
// 	const element = document.createElement('div');
//
// 	Object.keys(optionsFields).forEach(option => {
// 		if (typeof optionsFields[option] === 'boolean') {
// 			const checkbox = document.createElement('input');
// 			checkbox.setAttribute('type', 'checkbox');
// 			checkbox.setAttribute('id', option);
// 			checkbox.addEventListener('change', updateOptions(option));
// 			const label = document.createElement('label');
// 			label.setAttribute('for', option);
// 			label.textContent = option;
// 			element.appendChild(label);
// 			element.appendChild(checkbox);
// 		} else if (option === 'LIMIT') {
// 			const offset = document.createElement('input');
// 			offset.setAttribute('type', 'number');
// 			offset.setAttribute('id', 'offset');
// 			offset.addEventListener('change', updateOptions(option));
// 			const label1 = document.createElement('label');
// 			label1.setAttribute('for', 'offset');
// 			label1.textContent = 'offset';
// 			const limit = document.createElement('input');
// 			limit.setAttribute('type', 'number');
// 			limit.setAttribute('id', 'limit');
// 			limit.addEventListener('change', updateOptions(option));
// 			const label2 = document.createElement('label');
// 			label2.setAttribute('for', 'limit');
// 			label2.textContent = 'limit';
// 			element.appendChild(label1);
// 			element.appendChild(offset);
// 			element.appendChild(label2);
// 			element.appendChild(limit);
// 		}
// 	});
// 	return element;
// };

const addLabel = field => {
	const label = document.createElement('label');
	label.setAttribute('for', field.name);
	label.textContent = field.name;
	return label;
};

const runQuery = async () => {
	const query = [...command];
	query.push(queryString);
	query.concat(options);
	const response = await fetch('/query/', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
        },
//        redirect: 'follow', // manual, *follow, error
//        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify({"queryString": query}), // body data type must match "Content-Type" header
    });
	const results = await response.json();
	const resultArea = document.getElementById('results');
	resultArea.textContent = JSON.stringify(results, null, 2);
	console.log(results)
};

const main = async () => {
	const response = await fetch('/schema/?key=permits');
	schema = await response.json();
	console.log(schema);

	const form = document.getElementById('main');
	schema = schema.sort((a, b) => { return `${a.type}${a.name}` > `${b.type}${b.name}` ? 1 : -1});
	schema.forEach(field => {
		fieldTypes[field.name] = field.type;
		const fieldType = field.type;
		const genFunc = fieldMap[fieldType] || (field => null);
		const element = genFunc(field);
		if (element !== null) {
			form.appendChild(element);
		}
	});
	// form.appendChild(genOptions());
};

console.log('start');
main();
