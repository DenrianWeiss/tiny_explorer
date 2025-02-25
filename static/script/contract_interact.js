async function getABI(address) {
    const response = await fetch(`/api/abi/${address}`)
    return (await response.json()).result;
}

async function generateContractInterface(abi, contractAddress) {
    if (typeof window.ethereum === 'undefined') {
        alert('MetaMask is not installed!');
        return;
    }

    await window.ethereum.request({method: 'eth_requestAccounts'});
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const container = document.createElement('div');

    abi.forEach(item => {
        if (item.type === 'function') {
            let itemId = Array(16)
                .fill()
                .map(() => Math.round(Math.random() * 0xF).toString(16))
                .join('');;
            const form = document.createElement('div');
            form.classList.add("mdui-container");
            form.classList.add("mdui-typo")
            form.innerHTML = `<h5>${item.name}</h5>`;

            let ids = [];

            item.inputs.forEach(input => {
                const inputField = document.createElement('input');
                inputField.placeholder = `${input.name} (${input.type})`;
                inputField.name = input.name;
                inputField.required = true; // Make input required
                inputField.classList.add("mdui-textfield-input");
                // Randomly generate an id for inputField
                inputField.id = Array(16)
                    .fill()
                    .map(() => Math.round(Math.random() * 0xF).toString(16))
                    .join('');;
                ids.push(inputField.id);

                const label = document.createElement('label');
                label.classList.add("mdui-textfield-label");
                label.innerText = `${input.name} (${input.type})`;
                label.htmlFor = inputField.id;

                form.appendChild(label);
                form.appendChild(inputField);
            });

            let buttonHtml = `<button class="mdui-btn mdui-btn-raised ${item.stateMutability === 'view' ? 'mdui-color-indigo-200': 'mdui-color-pink-200'}" onclick="window.f${itemId}()">${item.stateMutability === 'view' ? 'Read': 'Write'}</button>`

            window['f' + itemId] = async () => {
                const args = ids.map(id => document.getElementById(id).value);

                // Validate inputs
                for (let i = 0; i < args.length; i++) {
                    if (!args[i]) {
                        alert(`Invalid input: ${item.inputs[i].name} is required`);
                        return;
                    }
                    if (item.inputs[i].type === 'address' && !ethers.utils.isAddress(args[i])) {
                        alert(`Invalid input: ${item.inputs[i].name} must be a valid address`);
                        return;
                    }
                    if (item.inputs[i].type === 'uint256' && !/^\d+$/.test(args[i])) {
                        alert(`Invalid input: ${item.inputs[i].name} must be a valid uint256`);
                        return;
                    }
                    if (item.inputs[i].type === 'bytes32' && !/^0x[0-9a-fA-F]{64}$/.test(args[i])) {
                        alert(`Invalid input: ${item.inputs[i].name} must be a valid bytes32`);
                        return;
                    }
                    if (item.inputs[i].type.endsWith('[]')) {
                        try {
                            JSON.parse(args[i]);
                        } catch (e) {
                            alert(`Invalid input: ${item.inputs[i].name} must be a valid array`);
                            return;
                        }
                    }
                    if (item.inputs[i].type.startsWith('tuple')) {
                        try {
                            JSON.parse(args[i]);
                        } catch (e) {
                            alert(`Invalid input: ${item.inputs[i].name} must be a valid tuple`);
                            return;
                        }
                    }
                }

                if (item.stateMutability === 'view') {
                    try {
                        const result = await contract[item.name](...args);
                        alert(`Result: ${result}`);
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                } else {
                    try {
                        const result = await contract[item.name](...args);
                        alert(`Transaction successful: ${result.hash}`);
                    } catch (error) {
                        alert(`Error: ${error.message}`);
                    }
                }
            };

            form.appendChild(document.createRange().createContextualFragment(buttonHtml));
            container.appendChild(form);
        }
    });

    return container.outerHTML;
}