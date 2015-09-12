/**
 * ProteinVisualisator, Brdej Grzegorz
 * Requirements: ThreeJS r71, Projector, OrbitControls, jQuery v1.11.2, modernizr v2.8.3
 * Library to create interactive 3-dimensional model of protein molecule. 
 * Allows for showing protein's model in popular molecules visualisation method such as:
 * wireframe, balls & sticks, secondary structures, simplify secondary structures.
 * 
 * @author Brdej Grzegorz
 * @module ProteinVisualisator 
 */
window.ProteinVisualisator = (function () {
    /**
     * Property which keeps object of ProteinVisualisator class
     * 
     * @property _self
     * @private
     * @type ProteinVisualisator
     */
    var _self;
        
        
    function ProteinVisualisator(_attr) {
        console.log( 'ProteinVisualisator init' );
        _self = this;
        
        _self.CONST = {};
        _self.CONST.ALL = 0;    // All atoms
        _self.CONST.HET = 1;    // Hetatom
        _self.CONST.SOL = 2;    // Solvent
        _self.CONST.PROT = 3;   // Protein atoms (atoms without hetatom and solvent)
        _self.CONST.M_CHAIN = 5;// Main chain atoms only
        _self.CONST.S_CHAIN = 6;// Side chain atoms only
        _self.CONST.WHET = 7;   // with hetatoms
        _self.CONST.WOHET = 8;  // without hetatoms
        _self.CONST.HELIX = 10; // helix
        _self.CONST.SHEET = 11; // beta-sheet
        _self.CONST.TURN = 12;  // turn
        
        _self.CONST.VISUALISATION_METHOD = {};
        _self.CONST.VISUALISATION_METHOD.BALL_AND_STICK = 0;
        _self.CONST.VISUALISATION_METHOD.ATOM = 1;
        _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT = 2;
        _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_THIN = 3;
        _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_CYLINDER = 4;
        _self.CONST.VISUALISATION_METHOD.STICK = 5;
        
        _self.CONST.COLORING_METHOD = {};
        _self.CONST.COLORING_METHOD.BY_ATOMS = 0;
        _self.CONST.COLORING_METHOD.BY_SPECTRUM = 1;
        _self.CONST.COLORING_METHOD.BY_POLARITY = 2;
        _self.CONST.COLORING_METHOD.BY_CHAINS = 3;
        _self.CONST.COLORING_METHOD.BY_SEC_STRUCT = 4;
        
        _self.options = $.extend( _self.defaultOptions, {} );
        _self.attr = {id:'protein_visualisator'};
        if( typeof _attr !== "object" ) {
            _self.attr.id = _attr;
        } else {
            if( typeof _attr.id !== "undefined" ) {
                _self.attr.id = _attr.id;
            }
            if( typeof _attr.name !== "undefined" ) {
                _self.attr.name = _attr.name;
            }
            if( typeof _attr.class !== "undefined" ) {
                _self.attr.class = _attr.class;
            }
        }
    };
    
    /** defaults properties **/
    // Reference: A. Bondi, J. Phys. Chem., 1964, 68, 441.
    ProteinVisualisator.prototype.atomRadius = {
        "H": 1.2, "Li": 1.82, "Na": 2.27, "K": 2.75, "C": 1.7, "N": 1.55, "O": 1.52,
        "F": 1.47, "P": 1.80, "S": 1.80, "CL": 1.75, "BR": 1.85, "SE": 1.90,
        "ZN": 1.39, "CU": 1.4, "NI": 1.63
    };
    
    ProteinVisualisator.prototype.atomColors = {
        "H": 0xCCCCCC, "C": 0x555555, "O": 0xCC0000, "N": 0x87CEEB, "S": 0xDDDD00, "P": 0xFF9900,
        "F": 0x1FF01F, "CL": 0x1FF01F, "BR": 0x992200, "I": 0x6600BB, "FE": 0xDD7700, "CA": 0x007700
    };
    
    ProteinVisualisator.prototype.polarResidues = ['ARG', 'HIS', 'LYS', 'ASP', 'GLU', 'SER', 'THR', 'ASN', 'GLN', 'CYS'];
    
    ProteinVisualisator.prototype.nonPolarResidues = ['GLY', 'PRO', 'ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TYR', 'TRP'];
    
    ProteinVisualisator.prototype.defaultOptions = {
        width: 300,
        height: 300,
        clearColor: 0x888383,
        sortObjects: false,
        scale: 1,
        sphereRadius: 1.5,
        cylinderRadius: 0.4,
        sphereQuality: 16,
        cylinderQuality: 12,
        tubeSegments: 12, // number of segments in mainchain tube 
        tubeWidth: 0.3, // width of segments in mainchain tube 
        lineWidth: 1.5,
        coilWidth: 0.3,
        betaStrandWidth: 0.4,
        helixSheetWidth: 1.3,
        nucleicAcidWidth: 0.8,
        defaultAtomColor: 0xDD77FF,
        betaStrandSmoothen: true,
        stripSegmentsNum: 10,
        strandNum: 6,
        
        axisDIV: 5, //?
        
        nerest: 50,
        farthest: -50,
        atomColor: 0xCCCCCC,
        polarResColor: 0xCC0000, 
        nonPolarResColor: 0xCCCCCC,
        betaSheatColor: 0x00CCCC,
        alphaHelixColor: 0xCC00CC,
        coloringMethodChanged: {}
    };
    
    /** **/
    ProteinVisualisator.prototype.checkDependencies = function() {
        if(window.jQuery && window.THREE  && window.THREE.REVISION==="71") {
            console.log(window.THREE.REVISION);
            return true;
        } 
        throw 'Dependencies error!';
    };
    
    ProteinVisualisator.prototype.animate = function() {
        requestAnimationFrame(_self.animate);
        _self.controls.update();
    };
    
    ProteinVisualisator.prototype.createScene = function() {
        _self.scene = new THREE.Scene();
        _self.scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
    };
    
    ProteinVisualisator.prototype.createRenderer = function(width, height) {
        _self.renderer = new THREE.WebGLRenderer({antialias: true});
        _self.renderer.sortObjects = false;
        _self.renderer.setSize( width, height );
        _self.parent.append( _self.renderer.domElement );
    };
    
    ProteinVisualisator.prototype.createCamera = function(width, height) {
        _self.camera = new THREE.PerspectiveCamera( 45, width / height, 1, 10000 );
        _self.camera.position.set(0,0,100);
        _self.camera.lookAt(new THREE.Vector3(0,0,0));
        _self.camera.near = 10;
        _self.camera.far = 400;
        _self.scene.add( _self.camera );
    };
    
    ProteinVisualisator.prototype.createLights = function() {
        _self.lights = [];
        var light1 = new THREE.PointLight(0xFFFFFF, 1, 1000);
        light1.position.set( 10, 10, 0 );
        _self.camera.add(light1);
        _self.lights.push( light1 );
    };
    
    ProteinVisualisator.prototype.initScene = function() {
        var width = _self.getWidth();
        var height = _self.getHeight();
        // Create scene
        _self.createScene();
        // Create a renderer and add it to the DOM
        _self.createRenderer(width, height);
        // Create camera
        _self.createCamera(width, height);
        // Create lights
        _self.createLights();
        // Create model container
        _self.modelObject = [];
        // Create array with geometries
        _self.geometries = [];
        // Add OrbitControls
        _self.controls = new THREE.OrbitControls( _self.camera, _self.renderer.domElement );
        _self.controls.addEventListener( 'change', _self.render );
        
        for( var attr in _self.attr ) {
            $(_self.renderer.domElement).attr(attr,_self.attr[attr]);
        }
    };
    
    ProteinVisualisator.prototype.updateRenderer = function(_options) {
        _self.options = $.extend( _self.options, _options );
        _self.renderer.setSize( _self.getWidth(), _self.getHeight() );
        _self.renderer.setClearColor( _self.getClearColor() );
        _self.renderer.sortObjects = _self.getSortObjects();
    };
    
    ProteinVisualisator.prototype.updateCamera = function(_options) {
        _self.options = $.extend( _self.options, _options );
        _self.camera.aspect = _self.getAspect();
        _self.camera.updateProjectionMatrix();
    };
    
    ProteinVisualisator.prototype.getRendererDomElement = function() {
        return _self.renderer.domElement ;
    };
    
    ProteinVisualisator.prototype.createModelGroup = function() {
        if( !(_self.modelObject.constructor === Array) ) {
            _self.modelObject = [];
        }
        var group = new THREE.Object3D();
        group.quaternion = new THREE.Quaternion(1, 0, 0, 0);
        group.name = 'model_group_' + _self.modelObject.length;
        _self.modelObject.push(group);
        _self.scene.add( group );
        return group;
    };
    
    ProteinVisualisator.prototype.getModelGroup = function() {
        if( !(_self.modelObject.constructor === Array) || _self.modelObject.length === 0 ) {
            _self.createModelGroup();
        }
        var group = _self.modelObject[_self.modelObject.length-1];
        return group;
    };
    
    ProteinVisualisator.prototype.clearScene = function() {
        for( var i in _self.modelObject ) {
            var group = _self.modelObject[i];
            var object = _self.scene.getObjectByName(group.name);
            _self.scene.remove( object );
        }
        _self.animate();
        
        _self.modelObject = [];
    };
    
    ProteinVisualisator.prototype.isEmptyModel = function() {
        return _self.modelObject.length > 0 ? false : true;
    };
        
    ProteinVisualisator.prototype.setOptions = function(_options) {
        _self.options = $.extend( _self.options, _options );
    };
    /** setters **/
    ProteinVisualisator.prototype.setWidth = function(_width) {
        _self.options.width = _width;
    };
    
    ProteinVisualisator.prototype.setHeight = function(_height) {
        _self.options.height = _height;
    };
    
    ProteinVisualisator.prototype.setClearColor = function(_clearColor) {
        _self.options.clearColor = _clearColor;
    };
    
    ProteinVisualisator.prototype.setSortObjects = function(_sortObjects) {
        _self.options.sortObjects = _sortObjects;
    };
    
    ProteinVisualisator.prototype.setScale = function(_scale) {
        _self.options.scale = _scale;
    };
    /** getters **/
    ProteinVisualisator.prototype.getWidth = function() {
        return _self.options.width * _self.options.scale;
    };
    
    ProteinVisualisator.prototype.getHeight = function() {
        return _self.options.height * _self.options.scale;
    };
    
    ProteinVisualisator.prototype.getParentWidth = function() {
        return _self.parent.width();
    };
    
    ProteinVisualisator.prototype.getParentHeight = function() {
        return _self.parent.height();
    };
    
    ProteinVisualisator.prototype.getAspect = function() {
        return _self.getWidth() / _self.getHeight();
    };
    
    ProteinVisualisator.prototype.getScale = function() {
        return _self.options.scale;
    };
    
    ProteinVisualisator.prototype.getClearColor = function() {
        return _self.options.clearColor;
    };
    
    ProteinVisualisator.prototype.getSortObjects = function() {
        return _self.options.sortObjects;
    };
    /**
     * Function to parse data in PDB format. 
     * PDB format structure is described eg. on page: http://www.wwpdb.org/documentation/file-format-content/format33/v3.3.html
     *
     * @method parsePDBFile
     * @private
     * @param String data String object containing data from loaded file
     * @return Promise Function returns Promise object cantaining object with data from pdb file divided into properties: 
     * info - information about in file, atoms - object containing Atom objects, sheets - object containing Sheet objects, 
     * helixes - object containing Helix objects, turns - object containing Turn objects, subunits - object containing subunit objects
     */
    ProteinVisualisator.prototype.parsePDBFile = function( data ) {
        var prom = new Promise(function(resolve, reject) {
            try {
                var subunits = {};
                var info = {};
                var atoms = {};
                var sheets = [];
                var helixes = [];
                var turns = [];
                var posMin = {x:1000000, y:1000000, z:1000000};
                var posMax = {x:-1000000,y:-1000000,z:-1000000};
                var firstId = null, lastId = null;
                
                var lines = data.split('\n');
                for( var i=0; i<lines.length; i++ ) {
                    var record = lines[i];
                    if( record === null || record === "" ) {
                        continue;
                    }

                    var recordName = record.substr(0,6).trim();
                    switch(recordName) {
                        case "HEADER":
                            info.header = [];
                            info.header.push(record.substr(6).trim().replace(/ +/g, " "));
                            break;
                        case "TITLE":
                            info.title = [];
                            info.title.push(record.substr(6).trim().replace(/ +/g, " "));
                            break;
                        case "AUTHOR":
                            info.author = [];
                            info.author.push(record.substr(6).trim().replace(/ +/g, " "));
                            break;
                        case "ATOM":
                        case "HETATM":
                            var atom = new Atom();
                            atom.parseRecord( record );
                            atom.setHeteroAtom( recordName==="ATOM"?false:true );
                            atoms[atom.id] = atom;
                            if(firstId === null) {
                                firstId = atom.id;
                            }
                            lastId = atom.id;
                            if(atom.pos.x > posMax.x) posMax.x = atom.pos.x;
                            if(atom.pos.y > posMax.y) posMax.y = atom.pos.y;
                            if(atom.pos.z > posMax.z) posMax.z = atom.pos.z;
                            if(atom.pos.x < posMin.x) posMin.x = atom.pos.x;
                            if(atom.pos.y < posMin.y) posMin.y = atom.pos.y;
                            if(atom.pos.z < posMin.z) posMin.z = atom.pos.z;
                            break;
                        case "CONECT":
                            var fromAtom = parseInt(record.substr(6,5));
                            var toAtom, order;
                            if( typeof atoms[fromAtom] === "undefined" ) break;
                            // bonds
                            toAtom = parseInt(record.substr(11,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setBonds(toAtom);
                                atoms[fromAtom].setBondsOrder(fromAtom > toAtom ? 0 : 1);
                            }
                            toAtom = parseInt(record.substr(16,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setBonds(toAtom);
                                atoms[fromAtom].setBondsOrder(fromAtom > toAtom ? 0 : 1);
                            }
                            toAtom = parseInt(record.substr(21,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setBonds(toAtom);
                                atoms[fromAtom].setBondsOrder(fromAtom > toAtom ? 0 : 1);
                            }
                            toAtom = parseInt(record.substr(26,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setBonds(toAtom);
                                atoms[fromAtom].setBondsOrder(fromAtom > toAtom ? 0 : 1);
                            }
                            // hydration bonds
                            toAtom = parseInt(record.substr(31,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setHydrBonds(toAtom);
                            }
                            toAtom = parseInt(record.substr(36,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setHydrBonds(toAtom);
                            }
                            toAtom = parseInt(record.substr(46,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setHydrBonds(toAtom);
                            }
                            toAtom = parseInt(record.substr(51,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setHydrBonds(toAtom);
                            }
                            // salt bonds
                            toAtom = parseInt(record.substr(41,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setSaltBonds(toAtom);
                            }
                            toAtom = parseInt(record.substr(56,5));
                            if( !isNaN(toAtom) ) {
                                atoms[fromAtom].setSaltBonds(toAtom);
                            }
                            break;
                        case "SHEET":
                            var sheet = new Sheet();
                            sheet.parseRecord(record);
                            sheets.push(sheet);
                            break;
                        case "HELIX":
                            var helix = new Helix();
                            helix.parseRecord(record);
                            helixes.push(helix);
                            break;
                        case "TURN":
                            var turn = new Turn();
                            turn.parseRecord(record);
                            turns.push(turn);
                            break;
                        case "TER":
                            var id = parseInt(record.substr(6,5));
                            subunits[id] = {first: firstId, last: lastId};
                            firstId = null; lastId = null;
                            break;
                        case "CRYST1":

                            break;
                        case "REMARK":

                            break;
                        case "COMPND":

                            break;
                    }
                }

                _self.assignSecondaryStructures(atoms, helixes, sheets, turns);
                _self.bounds = {posMin: posMin, posMax: posMax};
                resolve({info:info,atoms:atoms,sheets:sheets,helixes:helixes,turns:turns,subunits:subunits});
            } catch (err) {
                reject('parse error');
            }
        });
        return prom;
    };
    /**
     * Function to get square distance between two atoms.
     *
     * @method getSquaredDistance
     * @private
     * @param Object atom1pos object containing position of first atom in format: {x:posX,y:posY,z:posZ}
     * @param Object atom2pos object containing position of second atom in format: {x:posX,y:posY,z:posZ}
     * @return Float Function returns square distance between two atoms
     */
    ProteinVisualisator.prototype.getSquaredDistance = function(atom1pos, atom2pos) {
        return  (atom1pos.x - atom2pos.x) * (atom1pos.x - atom2pos.x) + 
                (atom1pos.y - atom2pos.y) * (atom1pos.y - atom2pos.y) + 
                (atom1pos.z - atom2pos.z) * (atom1pos.z - atom2pos.z);
    };
    /**
     * Function to check if two atoms are connected. It sometimes happend then PDB files do not contain informations about connections between atoms, so such information must be getting in other way.
     *
     * @method checkBond
     * @private
     * @param Atom atom1 object of Atom class
     * @param Atom atom2 object of Atom class
     * @return Integer Function returns 0 when atoms are not connected or 1 when they are
     */
    ProteinVisualisator.prototype.checkBond = function(atom1, atom2, mode) {
        var bond = atom1.bonds.indexOf(atom2.id);
        if( bond !== -1 ) 
            return atom1.bondsOrder[bond];

        if( mode === _self.CONST.WOHET && ( atom1.heteroAtom || atom2.heteroAtom ) ) 
            return 0;

        var squaredDistance = _self.getSquaredDistance(atom1.pos, atom2.pos);

        if( isNaN(squaredDistance) ) 
            return 0;

        if( squaredDistance > 1.3 && (atom1.element === 'H' || atom2.element === 'H') ) 
            return 0;
        if( squaredDistance < 3.42 && (atom1.element === 'S' || atom2.element === 'S') ) 
            return 1;
        if( squaredDistance > 2.78 ) 
            return 0;
        return 1;
    };

    ProteinVisualisator.prototype.assignStructure = function(atom, type, structers) {
        for( var j=0; j<structers.length; j++ ) {
            var structure = structers[j];
            if( atom.chainID !== structure.initChainID )
                continue;
            if( atom.resSeq < structure.initSeqNum )
                continue;
            if( atom.resSeq > structure.endSeqNum )
                continue;
            atom.structure.type = type;
            if( atom.resSeq === structure.initSeqNum ) 
                atom.structure.firstAtom = true;
            if( atom.resSeq === structure.endSeqNum )
                atom.structure.lastAtom = true;
            return true;
        }
        return false;
    };
    
    ProteinVisualisator.prototype.assignSecondaryStructures = function(atoms, helixes, sheets, turns) {
        for( var i in atoms ) {
            var atom = atoms[i];
            if( typeof atom === "undefined" ) {
                continue;
            }
            if( _self.assignStructure(atom, _self.CONST.HELIX, helixes) )
                continue;
            if( _self.assignStructure(atom, _self.CONST.SHEET, sheets) )
                continue;
            if( _self.assignStructure(atom, _self.CONST.TURN, turns) )
                continue;
        }
    };
    
    ProteinVisualisator.prototype.prepareProteinModel = function(_model) {
        _self.model = {};
        _self.model.info = _model.info;
        _self.model.atoms = _model.atoms;
        _self.model.sheets = _model.sheets;
        _self.model.helixes = _model.helixes;
        _self.model.turns = _model.turns;
        _self.model.subunits = _model.subunits;
        return _self.model;
    }; 
    
    ProteinVisualisator.prototype.setVisualisationMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.protein === "undefined" ) {
            _self.visualisation.protein = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.visualisation.protein.method = parseInt(_method);
    };
    
    ProteinVisualisator.prototype.setHeteroAtomVisualisationMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.heteroatom === "undefined" ) {
            _self.visualisation.heteroatom = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.visualisation.heteroatom.method = parseInt(_method);
    };
    
    ProteinVisualisator.prototype.setHeteroAtomVisualisation = function(_show) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.heteroatom === "undefined" ) {
            _self.visualisation.heteroatom = {};
        }
        if( typeof _show === "undefined" ) {
            _show = false;
        }
        _self.visualisation.heteroatom.show = _show;
    };
    
    ProteinVisualisator.prototype.setSolventVisualisationMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.solvent === "undefined" ) {
            _self.visualisation.solvent = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.visualisation.solvent.method = parseInt(_method);
    };
    
    ProteinVisualisator.prototype.setSolventVisualisation = function(_show) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.solvent === "undefined" ) {
            _self.visualisation.solvent = {};
        }
        if( typeof _show === "undefined" ) {
            _show = false;
        }
        _self.visualisation.solvent.show = _show;
    };
    
    ProteinVisualisator.prototype.setSideChainVisualisationMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.side_chain === "undefined" ) {
            _self.visualisation.side_chain = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.visualisation.side_chain.method = parseInt(_method);
    };
    
    ProteinVisualisator.prototype.setSideChainVisualisation = function(_show) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.side_chain === "undefined" ) {
            _self.visualisation.side_chain = {};
        }
        if( typeof _show === "undefined" ) {
            _show = false;
        }
        _self.visualisation.side_chain.show = _show;
    };
    
    ProteinVisualisator.prototype.setMainChainVisualisation = function(_show) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.main_chain === "undefined" ) {
            _self.visualisation.main_chain = {};
        }
        if( typeof _show === "undefined" ) {
            _show = false;
        }
        _self.visualisation.main_chain.show = _show;
    };
    
    ProteinVisualisator.prototype.getAtoms = function(atomslist, _mode) {
        var atoms = [];
        switch(_mode) {
            case _self.CONST.ALL:
                for( var i in _self.model.atoms ) {
                    atoms.push(parseInt(_self.model.atoms[i].id));
                }
                break;
            case _self.CONST.HET:
                for( var i in atomslist ) {
                    var atom = _self.model.atoms[atomslist[i]];
                    if( typeof atom !== "undefined" && atom.heteroAtom && atom.resName !== "HOH" ) {
                        atoms.push(parseInt(atom.id));
                    }
                }
                break;
            case _self.CONST.SOL:
                for( var i in atomslist ) {
                    var atom = _self.model.atoms[atomslist[i]];
                    if( typeof atom !== "undefined" && atom.heteroAtom && atom.resName === "HOH" ) {
                        atoms.push(parseInt(atom.id));
                    }
                }
                break;
            case _self.CONST.PROT:
                for( var i in atomslist ) {
                    var atom = _self.model.atoms[atomslist[i]];
                    if( typeof atom !== "undefined" && !atom.heteroAtom ) {
                        atoms.push(parseInt(atom.id));
                    }
                }
                break;
            case _self.CONST.M_CHAIN:
                for( var i in atomslist ) {
                    var atom = _self.model.atoms[atomslist[i]];
                    if( typeof atom !== "undefined" && !atom.heteroAtom ) {
                        atoms.push(parseInt(atom.id));
                    }
                }
                break;
            case _self.CONST.S_CHAIN:
                for( var i in atomslist ) {
                    var atom = _self.model.atoms[atomslist[i]];
                    if( typeof atom !== "undefined" && !atom.heteroAtom 
                            && (atom.atomName !== 'C' && atom.atomName !== 'O' 
                            && !(atom.atomName === 'N' && atom.resName !== "PRO")) ) {
                        atoms.push(parseInt(atom.id));
                    }
                }
                break;
            default:
                break;
        }
        return atoms;
    };
    
    ProteinVisualisator.prototype.excludeAtoms = function(atomslist, toExclude) {
        var atoms = [];
        var exclude = [];
        
        for( var i in toExclude ) {
            exclude[toExclude[i]] = true;
        }
        for( var i in atomslist ) {
            if( !exclude[i] )
                atoms.push(i);
        }
        
        return atoms;
    };
    
    ProteinVisualisator.prototype.setColorByAtom = function(atomslist, colors) {
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }
            var atomName = atom.element;
            if( atomName === "" ) {
                atomName = atom.atomName;
            }
            var color = colors[atomName];     
            if( typeof color === "undefined" ) {
                color = _self.atomColors[atomName];
            }
            if( typeof color === "undefined" ) {
                color = _self.options['atomColor'];
            }
            atom.color = color;
        }
    };
    
    ProteinVisualisator.prototype.setColorBySpectrum = function(atomslist) {
        var count = 0;
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }

            if( (atom.atomName !== 'CA' || atom.atomName !== 'O3\'') && !atom.heteroAtom ) {
                count++;
            }
        }
        var total = count;
        count = 0;
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }

            if( (atom.atomName !== 'CA' || atom.atomName !== 'O3\'') && !atom.heteroAtom ) {
                var color = new THREE.Color(0);
                color.setHSL(255.0 / 360 * (1 - count++ / total), 1, 0.5);
                atom.color = color.getHex();
            }
        }
    };

    ProteinVisualisator.prototype.setColorByResidue = function(atomslist, residueColorMap) {
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }
            var color = residueColorMap[atom.resName];
            if( typeof color !== "undefined" ) {
                atom.color = color;
            }
        }
    };

    ProteinVisualisator.prototype.setColorByPolarity = function(atomslist) {
        var colorMap = {};
        for( var i in _self.polarResidues ) {
            colorMap[_self.polarResidues[i]] = _self.options.polarResColor;
        }
        for( i in _self.nonPolarResidues ) {
            colorMap[_self.nonPolarResidues[i]] = _self.options.nonPolarResColor;
        }
        _self.setColorByResidue(atomslist, colorMap);   
    };

    ProteinVisualisator.prototype.setColorByChain = function(atomslist) {
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" || atom.heteroAtom ) {
                continue;
            }
            
            if( atom.atomName === 'CA' || atom.atomName === 'O3\'' ) {
                var color = new THREE.Color(0);
                color.setHSL((atom.chainID.charCodeAt(0) * 5) % 17 / 17.0, 1, 0.5);
                atom.color = color.getHex();
            }
        }
    };

    ProteinVisualisator.prototype.setStructuresColor = function(atomslist, colors) {
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" || atom.heteroAtom || atom.atomName !== 'CA' ) {
                continue;
            }
            if(atom.structure.type === _self.CONST.SHEET) {
                atom.color = typeof colors['beta_sheet'] !== "undefined" ? colors['beta_sheet'] : _self.options.betaSheatColor;
            } else if(atom.structure.type === _self.CONST.HELIX) {
                atom.color = typeof colors['alpha_helix'] !== "undefined" ? colors['alpha_helix'] : _self.options.alphaHelixColor;
            } else {
                atom.color = typeof colors['others'] !== "undefined" ? colors['others'] : _self.options.atomColor;
            }
        }
    };
        
    ProteinVisualisator.prototype.drawAtoms = function(atomslist, scale) {
        var sphereQuality = _self.options.sphereQuality;
        var sphereRadius = _self.options.sphereRadius;
        
        var group = _self.getModelGroup();
        if( !_self.geometries.sphereGeom ) {
            _self.geometries.sphereGeom = new THREE.SphereGeometry(1, sphereQuality, sphereQuality);
        }
        
        for( var i in atomslist ) {
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }
            
            var sphereMaterial = new THREE.MeshLambertMaterial( {color: atom.color} );
            var sphere = new THREE.Mesh( _self.geometries.sphereGeom, sphereMaterial );
            group.add(sphere);
            
            var radius = ( typeof _self.atomRadius[atom.element] !== "undefined" 
                                ? _self.atomRadius[atom.element] 
                                : sphereRadius );
            if( typeof scale !== "undefined" ) 
                radius *= scale;
            sphere.scale.x = sphere.scale.y = sphere.scale.z = radius;
            sphere.position.x = atom.pos.x;
            sphere.position.y = atom.pos.y;
            sphere.position.z = atom.pos.z;
            
            sphere.atom = atom;
        }
    };
    
    ProteinVisualisator.prototype.drawBondsAsLine = function(geometry, fromAtom, toAtom, order) {
        var vertices = geometry.vertices; 
        var colors = geometry.colors;
        var startPoint = new THREE.Vector3(fromAtom.pos.x, fromAtom.pos.y, fromAtom.pos.z);
        var endPoint = new THREE.Vector3(toAtom.pos.x, toAtom.pos.y, toAtom.pos.z);
        var midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);
        
        var color1 = new THREE.Color(fromAtom.color);
        var color2 = new THREE.Color(toAtom.color);
        if( order === 1 ) {
            vertices.push(startPoint); colors.push(color1); 
            vertices.push(midPoint); colors.push(color1); 
            vertices.push(endPoint); colors.push(color2); 
            vertices.push(midPoint); colors.push(color2); 
        } else {
//            console.log( order );
        }
    };
    
    ProteinVisualisator.prototype.drawBonds = function(atomslist, mode, scale) {
        var group = _self.getModelGroup();
        
        var geom = new THREE.Geometry();
        var atomNumber = atomslist.length;
        for( var i in atomslist ) {
            i = parseInt(i);
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" ) {
                continue;
            }
            
            for( var j = i + 1; j < i + 30 && j < atomNumber; j++ ) {
                var toAtom = _self.model.atoms[atomslist[parseInt(j)]];
                if( typeof toAtom === "undefined" ) {
                    continue;
                }
                if( mode === _self.CONST.WOHET && toAtom.heteroAtom ) {
                    continue;
                }
                var order = _self.checkBond(atom, toAtom, mode);
                if(order === 0) {
                    if( toAtom.bonds.indexOf(atom.id) === -1 )
                        continue;
                } 
                
                _self.drawBondsAsLine(geom,atom,toAtom,order);
            }
            for( var j in atom.bonds ) {
                var atomId = atom.bonds[j];
                if( atomId < i + 30 ) {
                    continue;
                }
                var toAtom = _self.model.atoms[atomId];
                if( typeof toAtom === "undefined" ) {
                    continue;
                }
                if( mode === _self.CONST.WOHET && toAtom.heteroAtom ) {
                    continue;
                }
                var order = atom.bondsOrder[j];
                if(order === 0) 
                    continue;
                
                _self.drawBondsAsLine(geom,atom,toAtom,order);
            }
        }
        var lineMaterial = new THREE.LineBasicMaterial({linewidth: _self.options.lineWidth})
        lineMaterial.vertexColors = true;

        var line = new THREE.Line(geom, lineMaterial, THREE.LinePieces);
        group.add(line);
    };
    
    ProteinVisualisator.prototype.drawProteinAsWireframe = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var protein = _self.getAtoms(atoms, _self.CONST.PROT);
        _self.changeColoringMethod('protein', protein,{});
        
        _self.drawAtoms(protein, 0.1);
        _self.drawBonds(protein, _self.CONST.WOHET, 0.1);
    };
    
    ProteinVisualisator.prototype.drawProteinAsSpacefilling = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var protein = _self.getAtoms(atoms, _self.CONST.PROT);
        _self.changeColoringMethod('protein', protein,{});
        
        _self.drawAtoms(protein);
    };
    
    ProteinVisualisator.prototype.drawProteinAsSecondaryStructure = function(_method) {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var protein = _self.getAtoms(atoms, _self.CONST.PROT);
        _self.changeColoringMethod('protein', protein,{});
        
        switch(_method) {
            case 'thin':
                var options = {'beta_strand_width':0.6};
                _self.drawStrand(protein, options['beta_strand_width'], 0.2, false, 2, 5, true);
                break;
            default:
                var options = {'beta_strand_width':0.6};
                _self.drawStrand(protein, options['beta_strand_width'], options['beta_strand_width'], false, 2, 5, true);
                break;
        }
    };
    
    ProteinVisualisator.prototype.drawProteinAsCylinderAndPlate = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var protein = _self.getAtoms(atoms, _self.CONST.PROT);
        _self.changeColoringMethod('protein', protein,{});
        
        var options = {'helix_cylinder_radius':1.6, 'beta_strand_width':0.6};
        
        var divided_atoms = _self.divideAtomsPerStructures(protein);
        if(divided_atoms['helix'].length > 0) { // TODO: and check if helix structures should be rendered
            _self.drawHelixAsCylinder(divided_atoms['helix'], options['helix_cylinder_radius']);
        }
        if(divided_atoms['others'].length > 0) { // TODO: and check if other atoms should be rendered
            _self.drawMainchain(divided_atoms['others']);
        }
        if(divided_atoms['beta'].length > 0) { // TODO: and check if beta structures should be rendered
            _self.drawStrand(divided_atoms['beta'], options['beta_strand_width'], options['beta_strand_width'], false, 2, 5, true);
        }
    };
    
    ProteinVisualisator.prototype.divideAtomsPerStructures = function(atomslist) {
        var others = [], beta = [], helix = [];

        for( var i in atomslist ) {
            i = parseInt(i);
            var atom = _self.model.atoms[atomslist[i]];
            if( typeof atom === "undefined" || atom.heteroAtom ) {
                continue;
            }
            if( atom.atomName === "CA" && ((atom.structure.type !== _self.CONST.HELIX && atom.structure.type !== _self.CONST.SHEET) || atom.structure.lastAtom || atom.structure.firstAtom) ) {
                others.push(atom.id);
            }
            if( atom.atomName !== 'CA' && atom.atomName !== 'O' ) {
                continue;
            }
            if( atom.structure.type === _self.CONST.SHEET ) {
                beta.push(atom.id);
            }
            if( atom.structure.type === _self.CONST.HELIX ) {
                helix.push(atom.id);
            }
        }
        
        return {'helix': helix, 'beta': beta, 'others': others};
    };

    ProteinVisualisator.prototype.drawStrand = function(atomslist, stripThickness, stripWidth, asStrands, strandsNum, segmentsNum, smoothen) {
        if( typeof stripThickness === "undefined" ) {
            stripThickness = _self.options.betaStrandWidth;
        }
        if( typeof stripWidth === "undefined" ) {
            stripWidth = _self.options.betaStrandWidth;
        }
        if( typeof asStrands === "undefined" ) {
            asStrands = false;
        }
        if( typeof strandsNum === "undefined" ) {
            strandsNum = _self.options.strandNum;
        }
        if( typeof segmentsNum === "undefined" ) {
            segmentsNum = _self.options.stripSegmentsNum;
        }
        if( typeof smoothen === "undefined" ) {
            smoothen = _self.options.betaStrandSmoothen;
        }
        
        var points = []; 
        for(var k = 0; k < strandsNum; k++) {
            points[k] = [];
        }
        var colors = [];
        var currentChain, currentResi, currentCA;
        var prevCO = null, secondaryStructure=null, secondaryStructureBorder = false;
        
        for( var i in atomslist ) {
            i = parseInt(i);
            var atom = _self.model.atoms[atomslist[i]];
            if(atom.heteroAtom) {
                continue;
            }
            if(atom.atomName === 'CA') {
                if( currentChain !== atom.chainID || currentResi + 1 !== atom.resSeq ) {
                    for(var j = 0; asStrands && j < strandsNum; j++) {
                        _self.drawSmoothLine(points[j], colors);
                    }
                    if(!asStrands && points[0].length > 0) {
                        _self.drawStrip(points[0], points[strandsNum-1], colors, segmentsNum, stripWidth);
                    }
                    var points = []; 
                    for(var k = 0; k < strandsNum; k++) {
                        points[k] = [];
                    }
                    colors = [];
                    prevCO = null; secondaryStructure = null; secondaryStructureBorder = false;
                }
                currentCA = new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z);
                currentChain = atom.chainID;
                currentResi = atom.resSeq;
                secondaryStructure = atom.structure.type; 
                secondaryStructureBorder = atom.structure.firstAtom || atom.structure.lastAtom;
                colors.push(atom.color);
            } else if(atom.atomName === 'O') { // O                
                if( typeof currentCA === "undefined" ) {
                    prevCO = new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z);
                    continue;
                }
                var atomO = new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z);
                atomO.sub(currentCA);
                atomO.multiplyScalar((secondaryStructure === null) ? stripThickness/6 : stripThickness);
                if(typeof prevCO !== "undefined" && prevCO && atomO.dot(prevCO) < 0) {
                    atomO.negate();
                }
                prevCO = atomO;
                for(var j = 0; j < strandsNum; j++) {
                    var delta = -1 + 2 / (strandsNum - 1) * j;
                    var v = new THREE.Vector3(currentCA.x + prevCO.x * delta, 
                                    currentCA.y + prevCO.y * delta, currentCA.z + prevCO.z * delta);
                    if(smoothen && secondaryStructure === _self.CONST.SHEET) {
                        v.smoothen = true;
                    }
                    points[j].push(v);
                }
            }
        }
        if(asStrands) {
            for (var j = 0; j < strandsNum; j++) {
                _self.drawSmoothLine(points[j], colors);
            }
        } else {
            _self.drawStrip(points[0], points[strandsNum-1], colors, segmentsNum, stripWidth);
        }
    };

    ProteinVisualisator.prototype.drawHelixAsCylinder = function(atomslist, radius) {
        if(typeof radius === "undefined") {
            radius = _self.atomRadius["C"];
        }
        var start = null;
        for(var i in atomslist) {
            i = parseInt(i);
            var atom = _self.model.atoms[atomslist[i]];
            
            if(atom.structure.lastAtom) {
                if(start !== null) {
                    _self.drawCylinder(new THREE.Vector3(start.x, start.y, start.z), new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z), radius, atom.color);
                }
                start = null;
            }
            if(start === null && atom.structure.firstAtom) {
                start = atom.pos;
            }
        }
        if(start !== null) {
            _self.drawCylinder(new THREE.Vector3(start.x, start.y, start.z), new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z), radius, atom.color);
        }
    };
    
    ProteinVisualisator.prototype.drawMainchain = function(atomslist, style) {
        var drawFunction;
        if( typeof style === "undefined" || style !== "line" ) {
            drawFunction = _self.drawSmoothTube;
        } else {
            drawFunction = _self.drawSmoothLine;
        }
        var points = [], colors = [];
        var currentChain, currentResi;
        for( var i in atomslist ) {
            i = parseInt(i);
            var atom = _self.model.atoms[atomslist[i]];   
            if( atom.atomName !== 'CA' ) {
                continue;
            }
            if( currentChain !== atom.chainID || currentResi + 1 !== atom.resSeq ) { 
                drawFunction(points, colors);
                points = []; colors = [];
            }
            points.push(new THREE.Vector3(atom.pos.x, atom.pos.y, atom.pos.z));
            colors.push(atom.color);
            currentChain = atom.chainID;
            currentResi = atom.resSeq;
        }
        drawFunction(points, colors);
    };

    ProteinVisualisator.prototype.drawSmoothLine = function(points, colors, lineSegments, lineWidth) {
        if(points.length < 2) {
            return;
        }
        if(typeof lineWidth === "undefined") {
            lineWidth = _self.options.lineWidth;
        }
        if(typeof lineSegments === "undefined") {
            lineSegments = _self.options.tubeSegments;
        }
        var group = _self.getModelGroup();
        var spline = new THREE.SplineCurve3(points);
        var geom = new THREE.Geometry();
        var splinePoints = spline.getPoints( _self.options.tubeSegments );
        for (var i=0; i<splinePoints.length; i++) {
            geom.vertices.push(splinePoints[i]);
            geom.colors.push(new THREE.Color(colors[(i==0)?0:Math.round((i-1)/_self.options.tubeSegments)]));
        }
        var mat = new THREE.LineBasicMaterial({linewidth: lineWidth});
        mat.vertexColors = true;
        var splineObject = new THREE.Line(geom, mat);
        splineObject.type = THREE.LineStrip;
        
        group.add(splineObject);
    };

    ProteinVisualisator.prototype.drawSmoothTube = function(chainPoints, colors, tubeSegments, tubeWidth) {
        if(chainPoints.length < 2) {
            return;
        }
        if(typeof tubeWidth === "undefined") {
            tubeWidth = _self.options.tubeWidth;
        }
        if(typeof tubeSegments === "undefined") {
            tubeSegments = _self.options.tubeSegments;
        }
        var circleDiv = tubeSegments, axisDiv = tubeSegments/2;
        
        var group = _self.getModelGroup();
        var geom = new THREE.Geometry();
        var points = _self.catmullRomSubdivide(chainPoints, axisDiv);
        var prevAxis1 = new THREE.Vector3(), prevAxis2;

        for(var i = 0, len = points.length; i < len; i++) {
            var idx = (i - 1) / axisDiv;
            var delta, axis1, axis2;

            if (i < len - 1) {
                delta = new THREE.Vector3().subVectors(points[i], points[i + 1]);
                axis1 = new THREE.Vector3(0, -delta.z, delta.y).normalize().multiplyScalar(tubeWidth);
                axis2 = new THREE.Vector3().crossVectors(delta, axis1).normalize().multiplyScalar(tubeWidth);
                if (prevAxis1.dot(axis1) < 0) {
                     axis1.negate(); axis2.negate(); 
                }
                prevAxis1 = axis1; prevAxis2 = axis2;
            } else {
                axis1 = prevAxis1; axis2 = prevAxis2;
            }
            for (var j = 0; j < circleDiv; j++) {
                var angle = 2 * Math.PI / circleDiv * j; 
                var c = Math.cos(angle), s = Math.sin(angle);
                geom.vertices.push(new THREE.Vector3(
                    points[i].x + c * axis1.x + s * axis2.x,
                    points[i].y + c * axis1.y + s * axis2.y, 
                    points[i].z + c * axis1.z + s * axis2.z
                ));
            }
        }

        var offset = 0;
        for (var i = 0, len = points.length - 1; i < len; i++) {
            var c =  new THREE.Color(colors[Math.round((i - 1)/ axisDiv)]);

            var reg = 0;
            var r1 = new THREE.Vector3().subVectors(geom.vertices[offset], geom.vertices[offset + circleDiv]).lengthSq();
            var r2 = new THREE.Vector3().subVectors(geom.vertices[offset], geom.vertices[offset + circleDiv + 1]).lengthSq();
            if (r1 > r2) {r1 = r2; reg = 1;};
            for (var j = 0; j < circleDiv; j++) {
                geom.faces.push(new THREE.Face3(offset + j, offset + (j + reg) % circleDiv + circleDiv, offset + (j + 1) % circleDiv));
                geom.faces.push(new THREE.Face3(offset + (j + 1) % circleDiv, offset + (j + reg) % circleDiv + circleDiv, offset + (j + reg + 1) % circleDiv + circleDiv));
                geom.faces[geom.faces.length -2].color = c;
                geom.faces[geom.faces.length -1].color = c;
            }
            offset += circleDiv;
        }
        geom.computeFaceNormals();
        geom.computeVertexNormals(false);
        var mat = new THREE.MeshLambertMaterial();
        mat.vertexColors = THREE.FaceColors;
        mat.shading = THREE.SmoothShading;
        mat.side = THREE.DoubleSide;
        var mesh = new THREE.Mesh(geom, mat);
        group.add(mesh);
    };
    /**
     * Function implementing Catmull-Rom subdivide algorithm. This algorithm is used to compute Control Points to draw spline on given points.
     * Catmull-Rom subdivide algorithm is described eg. on page: http://www.mvps.org/directx/articles/catmull/
     *
     * @method catmullRomSubdivide
     * @private
     * @param Array pointsList array of Atom.pos objects
     * @param Integer segmentsNum number of Control Points computed between two given points
     * @return Array Function returns array of Control Points
     */
    ProteinVisualisator.prototype.catmullRomSubdivide = function(pointsList, segmentsNum) {
        var ret = [];
        var points = []; 
        points.push(pointsList[0]);
        for(var i = 1, len = pointsList.length - 1; i < len; i++) {
            var p1 = pointsList[i], p2 = pointsList[i + 1];
            if(p1.smoothen) {
                points.push(new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2));
            } else {
                points.push(p1);
            }
        }
        points.push(pointsList[pointsList.length - 1]);

        for(var i = -1, size = points.length; i <= size - 3; i++) {
            var p0 = points[(i == -1) ? 0 : i];
            var p1 = points[i + 1];
            var p2 = points[i + 2];
            var p3 = points[(i == size - 3) ? size - 1 : i + 3];
            for (var j = 0; j < segmentsNum; j++) {
                var t = 1.0 / segmentsNum * j;
                var x = p1.x + t * (p2.x-p0.x)/2
                        + t * t * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x)/2
                        + t * t * t * (-1 * p0.x + 3 * p1.x - 3 * p2.x + p3.x)/2;
                var y = p1.y + t * (p2.y-p0.y)/2
                        + t * t * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y)/2
                        + t * t * t * (-1 * p0.y + 3 * p1.y - 3 * p2.y + p3.y)/2;
                var z = p1.z + t * (p2.z-p0.z)/2
                        + t * t * (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z)/2
                        + t * t * t * (-1 * p0.z + 3 * p1.z - 3 * p2.z + p3.z)/2;
                 ret.push(new THREE.Vector3(x, y, z));
            }
        }
        ret.push(points[points.length - 1]);
        return ret;
    };

    ProteinVisualisator.prototype.drawStrip = function(stripBorder1, stripBorder2, colors, segmentsNum, thickness) {
        if(stripBorder1.length < 2 || stripBorder2.length < 2) {
            return;
        }
        if(typeof segmentsNum === "undefined") {
            segmentsNum = _self.options.stripSegmentsNum;
        }
        var group = _self.getModelGroup();
        var stripBorder1 = _self.catmullRomSubdivide(stripBorder1, segmentsNum);
        var stripBorder2 = _self.catmullRomSubdivide(stripBorder2, segmentsNum);
   
        var geom = new THREE.Geometry();
        var vs = geom.vertices, fs = geom.faces;
        var p1, p2, p3, p4;
        var axis;
        var len = stripBorder1.length;
        
        for (var i = 0; i < len; i++) {
            p1 = stripBorder1[i]; 
            p2 = stripBorder2[i]; 
            if (i < len - 1) {
                var toNext = stripBorder1[i + 1].clone().sub(p1);
                var toSide = p1.clone().sub(p2);
                axis = toSide.cross(toNext).normalize().multiplyScalar(thickness);
            }
            p3 = p1.clone().add(axis); 
            p4 = p2.clone().add(axis); 
            
            vs.push(p1);vs.push(p2);vs.push(p3);vs.push(p4);
        }
        var faces = [[-8, -7, -4, -3], [-6, -8, -2, -4], [-5, -6, -1, -2], [-7, -5, -3, -1]];
        for(var i = 1; i < len; i++) {
            var color = new THREE.Color(colors[Math.round((i - 1)/ segmentsNum)]);
            var offset = Math.abs(( 8 * i ) / 2) + 4;
            for (var j = 0; j < 4; j++) {
                var f = new THREE.Face3(offset + faces[j][0], offset + faces[j][3], offset + faces[j][1], undefined, color);
                fs.push(f);
                f = new THREE.Face3(offset + faces[j][0], offset + faces[j][2], offset + faces[j][3], undefined, color);
                fs.push(f);
            }
        }
        var vsize = vs.length - 4;
        for(var i = 0; i < 4; i++) {
            vs.push(vs[i]); 
            vs.push(vs[vsize + i]);
        };
        vsize += 4;
        fs.push(new THREE.Face3(vsize, vsize+2, vsize+6, undefined, fs[0].color));
        fs.push(new THREE.Face3(vsize, vsize+6, vsize+4, undefined, fs[0].color));
        fs.push(new THREE.Face3(vsize+1, vsize+3, vsize+7, undefined, fs[fs.length - 3].color));
        fs.push(new THREE.Face3(vsize+1, vsize+7, vsize+5, undefined, fs[fs.length - 3].color));
        
        geom.computeFaceNormals();
        geom.computeVertexNormals(false);
        var mat =  new THREE.MeshLambertMaterial();
        mat.vertexColors = THREE.FaceColors;
        mat.shading = THREE.NoShading;
        mat.side = THREE.DoubleSide;
        var mesh = new THREE.Mesh(geom, mat); 
        group.add(mesh);
    };

    ProteinVisualisator.prototype.drawCylinder = function(start, end, radius, color) {
        if( !start || !end ) 
            return;
        var group = _self.getModelGroup();
        var cylinderQuality = _self.options.cylinderQuality;
        var HALF_PI = Math.PI * 0.5;
        var distance = start.distanceTo(end);
        var position = new THREE.Vector3().addVectors(end, start).multiplyScalar(0.5);
        
        var cylinderGeom = new THREE.CylinderGeometry(radius, radius, distance, cylinderQuality, 1);
        var cylinderMaterial = new THREE.MeshLambertMaterial({color: color});
        
        var orientation = new THREE.Matrix4();
        var offsetRotation = new THREE.Matrix4();
        var offsetPosition = new THREE.Matrix4();
        orientation.lookAt(start,end,new THREE.Vector3(0,1,0));
        offsetRotation.makeRotationX(HALF_PI);
        orientation.multiply(offsetRotation);
        cylinderGeom.applyMatrix(orientation);

        var cylinder = new THREE.Mesh(cylinderGeom, cylinderMaterial);
        group.add(cylinder);
        cylinder.position.x = position.x;
        cylinder.position.y = position.y;
        cylinder.position.z = position.z;
        cylinder.updateMatrix();
        cylinder.matrixAutoUpdate = false;
    };

    ProteinVisualisator.prototype.drawProtein = function() {
        if(typeof _self.visualisation.protein === "undefined") {
            _self.visualisation.protein = {};
            _self.visualisation.protein.method = _self.CONST.VISUALISATION_METHOD.BALL_AND_STICK;
        }
        switch(_self.visualisation.protein.method) {
            case _self.CONST.VISUALISATION_METHOD.ATOM:
                console.log( 'drawProteinAsSpacefilling' );
                _self.drawProteinAsSpacefilling();
                break;
            case _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT:
                console.log( 'drawProteinAsSecondaryStructure' );
                _self.drawProteinAsSecondaryStructure('ribbon');
                break;
            case _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_THIN:
                console.log( 'drawProteinAsSecondaryStructure - thin' );
                _self.drawProteinAsSecondaryStructure('thin');
                break;
            case _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_CYLINDER:
                console.log( 'drawProteinAsCylinderAndPlate' );
                _self.drawProteinAsCylinderAndPlate();
                break;
            default:
                console.log( 'drawProteinAsWireframe' );
                _self.drawProteinAsWireframe();
                break;
        }
    };
    
    ProteinVisualisator.prototype.drawHeteroAtomAsSphere = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var hetatom = _self.getAtoms(atoms, _self.CONST.HET);
        _self.changeColoringMethod('heteroatom', hetatom,{});
        
        _self.drawAtoms(hetatom);
    };
    
    ProteinVisualisator.prototype.drawHeteroAtomAsBallAndStick = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var hetatom = _self.getAtoms(atoms, _self.CONST.HET);
        _self.changeColoringMethod('heteroatom', hetatom,{});
        
        _self.drawAtoms(hetatom, 0.1);
        _self.drawBonds(hetatom, _self.CONST.HET, 0.1);
    };
    
    ProteinVisualisator.prototype.drawHeteroAtomAsLine = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var hetatom = _self.getAtoms(atoms, _self.CONST.HET);
        _self.changeColoringMethod('heteroatom', hetatom,{});
        
        _self.drawBonds(hetatom, 0.2);
    };
    
    ProteinVisualisator.prototype.drawHeteroatom = function() {
        if( typeof _self.visualisation.heteroatom === "undefined" || !_self.visualisation.heteroatom.show ) {
            return ;
        }
        switch(_self.visualisation.heteroatom.method) {
            case _self.CONST.VISUALISATION_METHOD.ATOM:
                console.log( 'drawHeteroAtomAsSphere' );
                _self.drawHeteroAtomAsSphere();
                break;
            case _self.CONST.VISUALISATION_METHOD.STICK:
                console.log( 'drawHeteroAtomAsLine' );
                _self.drawHeteroAtomAsLine();
                break;
            default:
                console.log( 'drawHeteroAtomAsBallAndStick' );
                _self.drawHeteroAtomAsBallAndStick();
                break;
        }
    };
    
    ProteinVisualisator.prototype.drawSolventAsSphere = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var solvent = _self.getAtoms(atoms, _self.CONST.SOL);
        _self.changeColoringMethod('solvent', solvent,{});
        
        _self.drawAtoms(solvent, 0.6);
    };
    
    ProteinVisualisator.prototype.drawSolvent = function() {
        if( typeof _self.visualisation.solvent === "undefined" || !_self.visualisation.solvent.show ) {
            return ;
        }
        switch(_self.visualisation.solvent.method) {
            default:
                console.log( 'drawSolventAsSphere' );
                _self.drawSolventAsSphere();
                break;
        }
    };
    
    ProteinVisualisator.prototype.drawSideChainAsBallAndStick = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var sideChain = _self.getAtoms(atoms, _self.CONST.S_CHAIN);
        _self.changeColoringMethod('protein', sideChain,{});    // MEMO: set the same color of side chain as main chain, changed this ?
        
        _self.drawAtoms(sideChain, 0.1);
        _self.drawBonds(sideChain, _self.CONST.S_CHAIN, 0.1);
    };
    
    ProteinVisualisator.prototype.drawSideChainAsLine = function() {
        var atoms = _self.getAtoms([], _self.CONST.ALL);
        var sideChain = _self.getAtoms(atoms, _self.CONST.S_CHAIN);
        _self.changeColoringMethod('protein', sideChain,{});    // MEMO: set the same color of side chain as main chain, changed this ?
        
        _self.drawBonds(sideChain, 0.2);
    };
    
    ProteinVisualisator.prototype.drawSideChain = function() {
        if( typeof _self.visualisation.side_chain === "undefined" || !_self.visualisation.side_chain.show ) {
            return ;
        }
        switch(_self.visualisation.side_chain.method) {
            case _self.CONST.VISUALISATION_METHOD.STICK:
                console.log( 'drawSideChainAsLine' );
                _self.drawSideChainAsLine();
                break;
            default:
                console.log( 'drawSideChainAsBallAndStick' );
                _self.drawSideChainAsBallAndStick();
                break;
        }
    };
    
    ProteinVisualisator.prototype.setColoringMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.protein === "undefined" ) {
            _self.visualisation.protein = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.options.coloringMethodChanged['protein'] = false;
        if( _self.visualisation.protein.coloring !== _method ) {
             _self.visualisation.protein.coloring = _method;
            _self.options.coloringMethodChanged['protein'] = true;
        }
    };
    
    ProteinVisualisator.prototype.setHeteroatomColoringMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.protein === "undefined" ) {
            _self.visualisation.protein = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.options.coloringMethodChanged['heteroatom'] = false;
        if( _self.visualisation.heteroatom.coloring !== _method ) {
             _self.visualisation.heteroatom.coloring = _method;
            _self.options.coloringMethodChanged['heteroatom'] = true;
        }
    };
    
    ProteinVisualisator.prototype.setSolventColoringMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.solvent === "undefined" ) {
            _self.visualisation.solvent = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.options.coloringMethodChanged['solvent'] = false;
        if( _self.visualisation.solvent.coloring !== _method ) {
             _self.visualisation.solvent.coloring = _method;
            _self.options.coloringMethodChanged['solvent'] = true;
        }
    };
    
    ProteinVisualisator.prototype.setSidechainColoringMethod = function(_method) {
        if( typeof _self.visualisation === "undefined" ) {
            _self.visualisation = {};
        }
        if( typeof _self.visualisation.side_chain === "undefined" ) {
            _self.visualisation.side_chain = {};
        }
        if( typeof _method === "undefined" ) {
            _method = 0;
        }
        _self.options.coloringMethodChanged['side_chain'] = false;
        if( _self.visualisation.side_chain.coloring !== _method ) {
             _self.visualisation.side_chain.coloring = _method;
            _self.options.coloringMethodChanged['side_chain'] = true;
        }
    };
    
    ProteinVisualisator.prototype.changeColoringMethod = function(_type, _atomslist, _colors) {
        if( typeof _colors === "undefined" ) {
            _colors = {};
        }
        if( typeof _type === "undefined" ) {
            _type = 'protein';
        }
        if( typeof _self.options.coloringMethodChanged[_type] !== "undefined" && !_self.options.coloringMethodChanged[_type] ) {
            return ;
        }
        if( typeof _self.visualisation[_type].coloring === "undefined" ) {
            _self.visualisation[_type].coloring = '0';
        }
        switch(_self.visualisation[_type].coloring) {
            case '1':
                console.log( 'setColorBySpectrum' );
                _self.setColorBySpectrum(_atomslist, _colors);
                break;
            case '2':
                console.log( 'setColorByPolarity' );
                _self.setColorByPolarity(_atomslist, _colors);
                break;
            case '3':
                console.log( 'setColorByChain' );
                _self.setColorByChain(_atomslist, _colors);
                break;
            case '4':
                console.log( 'setStructuresColor' );
                _self.setStructuresColor(_atomslist, _colors);
                break;
            default:
                console.log( 'setColorByAtom' );
                _self.setColorByAtom(_atomslist, _colors);
                break;
        }
    };
    
    ProteinVisualisator.prototype.getContentBounds = center = function() {
        if(typeof _self.bounds === "undefined" || typeof _self.bounds.posMin === "undefined" || typeof _self.bounds.posMax === "undefined") {
            return false;
        }
        return _self.bounds;
    };
    
    ProteinVisualisator.prototype.centerModel = function() {
        var bounds = _self.getContentBounds();
        var bWidth = bounds.posMax.x  - bounds.posMin.x;
        var bHeight = bounds.posMax.y  - bounds.posMin.y;
        var bDepth = bounds.posMax.z  - bounds.posMin.z;
        var center = new THREE.Vector3(
                bounds.posMin.x + (bWidth / 2), 
                bounds.posMin.y + (bHeight / 2), 
                bounds.posMin.z + (bDepth / 2));
        
        var group = _self.getModelGroup();
        group.position.sub(center);
    };

    ProteinVisualisator.prototype.drawModel = function() {
        _self.drawProtein();
        _self.drawHeteroatom();
        _self.drawSolvent();
        _self.drawSideChain();
        _self.centerModel();
    };
        
    ProteinVisualisator.prototype.isEmptyObject = function(obj) {
        for(var prop in obj) {
          return false;
        }
        return true;
    }
    
    ProteinVisualisator.prototype.readFile = function(file, errorHandler) {
        var reader = new FileReader();
        if(typeof errorHandler === "undefined") {
            errorHandler = function(err) {
                _self.clearScene();
                _self.prepareProteinModel([]);
                _self.render();
                alert(err);
            };
        }
        reader.onloadend = function(e) {
            if( e.target.readyState === FileReader.DONE ) {
                _self.parsePDBFile( e.target.result ).then(function(ret) {
                    if(_self.isEmptyObject(ret.atoms)) {
                        return this.reject('error');
                    }
                    return ret; 
                }, function(err) {
                    errorHandler(__('errors.structure.pdb'));
                }).then(function(ret) {
                    _self.clearScene();
                    _self.prepareProteinModel([]);
                    _self.prepareProteinModel(ret);
                    _self.drawModel();
                    _self.render();
                }, function(err) {
                    errorHandler(__('errors.parsing.pdb'));
                });
            }
        };

        reader.readAsBinaryString(file);
    };
        
    ProteinVisualisator.prototype.getVisualisationMethod = function(_part) {
        if( typeof _self.visualisation === "undefined" ) {
            return 0;
        }
        return _self.visualisation[_part].method;
    };
    
    ProteinVisualisator.prototype.getColoringMethod = function(_part) {
        if( typeof _self.visualisation === "undefined" ) {
            return 0;
        }
        return _self.visualisation[_part].coloring;
    };
    /**
     * Function to render scene. It also return render time on javascript console.
     *
     * @method render
     * @private
     */
    ProteinVisualisator.prototype.render = function() {
        var startTime = new Date();
        _self.renderer.render(_self.scene, _self.camera);
        console.log("Rendered in " + (new Date() - startTime) + "ms");
    };
    
    ProteinVisualisator.prototype.handleEvent = function() {
        window.addEventListener( 'resize', _self.onWindowResize, false );
//        window.addEventListener( 'mousedown', _self.onMouseDown, false );
    };
    
    ProteinVisualisator.prototype.createProteinVisualisationMethodPanelOptions = function(options) {
        var options = $.extend(true, {
            parent: _self.parent,
            div: {id:'protein_visualisator_render_method',class:''},
            options: {
                BALL_AND_STICK: {render: true, checked: false, label: {id:'',class:'',text:'label.protein.ball_and_stick'}, input: {id:'',class:'',name:'protein_render_method'}},
                ATOM: {render: true, checked: false, label: {id:'',class:'',text:'label.protein.atom'}, input: {id:'',class:'',name:'protein_render_method'}},
                SECENDARY_STRUCT: {render: true, checked: false, label: {id:'',class:'',text:'label.protein.secondary_structure'}, input: {id:'',class:'',name:'protein_render_method'}},
                SECENDARY_STRUCT_THIN: {render: true, checked: true, label: {id:'',class:'',text:'label.protein.secondary_structure_thin'}, input: {id:'',class:'',name:'protein_render_method'}},
                SECENDARY_STRUCT_CYLINDER: {render: true, checked: false, label: {id:'',class:'',text:'label.protein.secondary_structure_cylinder'}, input: {id:'',class:'',name:'protein_render_method'}}
            }
        }, options);
        options['options']['BALL_AND_STICK']['input']['value'] = _self.CONST.VISUALISATION_METHOD.BALL_AND_STICK;
        options['options']['ATOM']['input']['value'] = _self.CONST.VISUALISATION_METHOD.ATOM;
        options['options']['SECENDARY_STRUCT']['input']['value'] = _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT;
        options['options']['SECENDARY_STRUCT_THIN']['input']['value'] = _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_THIN;
        options['options']['SECENDARY_STRUCT_CYLINDER']['input']['value'] = _self.CONST.VISUALISATION_METHOD.SECENDARY_STRUCT_CYLINDER;
        
        return options;
    };
    
    ProteinVisualisator.prototype.createHeteroatomVisualisationMethodPanelOptions = function(options) {
        var options = $.extend(true, {
            parent: _self.parent,
            div: {id:'protein_visualisator_hetatom_render_method',class:''},
            options: {
                BALL_AND_STICK: {render: true, checked: false, label: {id:'',class:'',text:'label.hetatom.ball_and_stick'}, input: {id:'',class:'',name:'hetatom_render_method'}},
                ATOM: {render: true, checked: true, label: {id:'',class:'',text:'label.hetatom.atom'}, input: {id:'',class:'',name:'hetatom_render_method'}},
                STICK: {render: true, checked: false, label: {id:'',class:'',text:'label.hetatom.stick'}, input: {id:'',class:'',name:'hetatom_render_method'}}
            }
        }, options);
        options['options']['BALL_AND_STICK']['input']['value'] = _self.CONST.VISUALISATION_METHOD.BALL_AND_STICK;
        options['options']['ATOM']['input']['value'] = _self.CONST.VISUALISATION_METHOD.ATOM;
        options['options']['STICK']['input']['value'] = _self.CONST.VISUALISATION_METHOD.STICK;
        
        return options;
    };
    
    ProteinVisualisator.prototype.createSolventVisualisationMethodPanelOptions = function(options) {
        var options = $.extend(true, {
            parent: _self.parent,
            div: {id:'protein_visualisator_solvent_render_method',class:''},
            options: {
                BALL_AND_STICK: {render: false, checked: false, label: {id:'',class:'',text:'label.solvent.ball_and_stick'}, input: {id:'',class:'',name:'solvent_render_method'}},
                ATOM: {render: true, checked: true, label: {id:'',class:'',text:'label.solvent.atom'}, input: {id:'',class:'',name:'solvent_render_method'}}
            }
        }, options);
        options['options']['ATOM']['input']['value'] = _self.CONST.VISUALISATION_METHOD.ATOM;
        
        return options;
    };
    
    ProteinVisualisator.prototype.createSidechainVisualisationMethodPanelOptions = function(options) {
        var options = $.extend(true, {
            parent: _self.parent,
            div: {id:'protein_visualisator_side_chain_render_method',class:''},
            options: {
                BALL_AND_STICK: {render: true, checked: true, label: {id:'',class:'',text:'label.side_chain.ball_and_stick'}, input: {id:'',class:'',name:'side_chain_render_method'}},
                STICK: {render: true, checked: false, label: {id:'',class:'',text:'label.side_chain.stick'}, input: {id:'',class:'',name:'side_chain_render_method'}}
            }
        }, options);
        options['options']['BALL_AND_STICK']['input']['value'] = _self.CONST.VISUALISATION_METHOD.BALL_AND_STICK;
        options['options']['STICK']['input']['value'] = _self.CONST.VISUALISATION_METHOD.STICK;
        
        return options;
    };
    
    ProteinVisualisator.prototype.createProteinColoringOptions = function(part, options) {
        var options = $.extend(true, {
            parent: _self.parent,
//            div: {id:'protein_visualisator_protein_coloring_method',class:''},
            select: {
                id: part+'_coloring_method',
                class: ''
            },
            options: {
                BY_ATOMS: {render: true, id:'', class:'', selected:false, text:'label.'+part+'.by_atoms'},
                BY_SPECTRUM: {render: true, id:'', class:'', selected:true, text:'label.'+part+'.by_spectrum'},
                BY_POLARITY: {render: true, id:'', class:'', selected:false, text:'label.'+part+'.by_polarity'},
                BY_CHAINS: {render: true, id:'', class:'', selected:false, text:'label.'+part+'.by_chains'},
                BY_SEC_STRUCT: {render: true, id:'', class:'', selected:false, text:'label.'+part+'.by_sec_struct'}
            }
        }, options);
        options['options']['BY_ATOMS']['value'] = _self.CONST.COLORING_METHOD.BY_ATOMS;
        options['options']['BY_SPECTRUM']['value'] = _self.CONST.COLORING_METHOD.BY_SPECTRUM;
        options['options']['BY_POLARITY']['value'] = _self.CONST.COLORING_METHOD.BY_POLARITY;
        options['options']['BY_CHAINS']['value'] = _self.CONST.COLORING_METHOD.BY_CHAINS;
        options['options']['BY_SEC_STRUCT']['value'] = _self.CONST.COLORING_METHOD.BY_SEC_STRUCT;
        
        return options;
    };
    
    ProteinVisualisator.prototype.createShowButtonPanelOptions = function(part, options) {
        var options = $.extend(true, {
            parent: _self.parent,
//            div: {id:'protein_visualisator_'+part+'_show',class:''},
            render: true, 
            label: {id:'',class:'',text:'label.'+part+'.show'}, 
            input: {id:part+'_show',class:'',name:part+'_show'}
        }, options);
        
        return options;
    };
    
    ProteinVisualisator.prototype.createShowButtonPanel = function(options) {
        var returnedId = null;
        var div = null;
        var label = $('<label>', {for:options['input']['name']});
        if(options['label']['class']!=="") {
            label.addClass(options['label']['class']);
        }
        if(options['label']['id']!=="") {
            label.attr('id',options['label']['id']);
        }
        var input = $('<input>', {type:'checkbox', name:options['input']['name'], id:options['input']['id']}).appendTo(label);
        if(options['input']['class']!=="") {
            input.addClass(options['input']['class']);
        }
        if(typeof options['div'] !== "undefined") {
            div =  $('<div>',{id:options['div']['id']}).prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
            if(options['div']['class']!=="") {
                div.addClass(options['div']['class']);
            }
            div.append(label);
        }
        label.append(__(options['label']['text']));
        if(div==null) {
            label.prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
        }
        returnedId = options['input']['name'];
        
        return returnedId;
    };
    
    ProteinVisualisator.prototype.createVisualisationMethodPanel = function(options) {
        var methodPanel = options['div']['id'];
        var div =  $('<div>',{id:methodPanel}).prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
        if(options['div']['class']!=="") {
            div.addClass(options['div']['class']);
        }
        for(var key in options['options']) {
            if(!options['options'][key]['render']) {
                continue;
            }
            var label = $('<label>').appendTo(div);
            if(options['options'][key]['label']['class']!=="") {
                label.addClass(options['options'][key]['label']['class']);
            }
            if(options['options'][key]['label']['id']!=="") {
                label.attr('id',options['options'][key]['label']['id']);
            }
            var input = $('<input>', {type: 'radio', name: options['options'][key]['input']['name'], value: options['options'][key]['input']['value']}).appendTo(label);
            if(options['options'][key]['input']['class']!=="") {
                input.addClass(options['options'][key]['input']['class']);
            }
            if(options['options'][key]['input']['id']!=="") {
                input.attr('id',options['options'][key]['input']['id']);
            }
            if(options['options'][key]['checked']) {
                input.attr('checked','checked');
            } else {
                input.removeAttr('checked');
            }
            label.append(__(options['options'][key]['label']['text']));
        }
        
        return methodPanel;
     };
    
    ProteinVisualisator.prototype.createColoringMethodPanel = function(options) {
        var returnedId = null;
        var div = null;
        var select = $('<select>',{id:options['select']['id']});
        if(options['select']['class']!=="") {
            select.addClass(options['select']['class']);
        }
        for(var key in options['options']) {
            if(!options['options'][key]['render']) {
                continue;
            }
            var option = $('<option>',{value:options['options'][key]['value']}).appendTo(select);
            if(options['options'][key]['class']!=='') {
                option.addClass(options['options'][key]['class']);
            }
            if(options['options'][key]['id']!=="") {
                option.attr('id',options['options'][key]['id']);
            }
            if(options['options'][key]['selected']) {
                option.attr('selected','selected');
            } else {
                option.removeAttr('selected');
            }
            option.append(__(options['options'][key]['text']));
        }
        
        if(typeof options['div'] !== "undefined") {
            div =  $('<div>',{id:options['div']['id']}).prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
            if(options['div']['class']!=="") {
                div.addClass(options['div']['class']);
            }
            div.append(select);
        }
        if(div==null) {
            select.prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
        }
        
        returnedId = options['select']['id'];
        return returnedId;
     };
    
    ProteinVisualisator.prototype.createLoadFilePanelOptions = function(options) {
        var options = $.extend(true, {
            parent: _self.parent,
//            div: {id:'',class:''},
            file: {
                id: 'ProtVis_load_file_panel',
                class: '',
                name: 'ProtVis_load_file_panel'
            }
        }, options);
        
        return options;
    };
    
    ProteinVisualisator.prototype.createLoadFilePanel = function(options) {
        var returnedId = null;
        var div = null;
        var file = $('<input>',{type:'file',id:options['file']['id'],name:options['file']['name']});
        if(options['file']['class']!=="") {
            file.addClass(options['file']['class']);
        }
        
        if(typeof options['div'] !== "undefined") {
            div =  $('<div>',{id:options['div']['id']}).prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
            if(options['div']['class']!=="") {
                div.addClass(options['div']['class']);
            }
            div.append(file);
        } else {
            file.prependTo(options['parent'] instanceof jQuery ? options['parent'] : $('#'+options['parent']));
        }
        
        returnedId = options['file']['id'];
        return returnedId;
    };
    
    
    /**
     * ProteinVisualisator class
     *
     * @class ProteinVisualisator
     */
    var proteinVisualisator = {
        /**
         * Function to initialise ProteinVisualisator library object. It calls ProteinVisualisator constructor, check dependencies, initialise resize event handler 
         * and create ThreeJS objects such as scene, camera, lights, renderer, controls.
         *
         * @method init
         * @param String parentSelector html selector to element where ThreeJS renderer should be initialised.
         * @param Object attr object containing some of attributes for canvas element, such as: name, id, class
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        init: function(parentSelector,attr) {
            new ProteinVisualisator(attr);
            var pv = _self;
            // check for dependencies (jQuery & ThreeJS)
            pv.checkDependencies();
            if($(parentSelector).length > 0) {
                pv.parent = $(parentSelector);
            } else {
                alert( 'You must specify content element' );
                return false;
            }

            pv.handleEvent();
            pv.initScene();
            pv.animate();
            return proteinVisualisator;
        },
        /**
         * Function clear protein model. Removes protein data containing in ProteinVisualisator class.
         *
         * @method clearModel
         */
        clearModel: function() {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            pv.prepareProteinModel([]);
        },
        /**
         * Function to add handler for changing visualisation method of protein atoms. If first argument is null, this function also creates radio buttons for visualiosation methods.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'},
                options: {
                    BALL_AND_STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    ATOM: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    SECENDARY_STRUCT: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    SECENDARY_STRUCT_THIN: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    SECENDARY_STRUCT_CYLINDER: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}}
                }
            }
         * @method addChangeVisualisationMethodListener
         * @param String|null methodPanel id of DOM element containing radio buttons for visualisation methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create visualisation methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeVisualisationMethodListener: function(methodPanel, options) {
            if(typeof _self === "undefined") {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(methodPanel == null) {
                methodPanel = pv.createVisualisationMethodPanel(pv.createProteinVisualisationMethodPanelOptions(options));
            }
            $('#'+methodPanel).on('change', function(ev) {
                var method = $(':radio:checked', this).val();
                pv.setVisualisationMethod(method);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+methodPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing coloring method of protein atoms. If first argument is null, this function also creates select options for coloring methods.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'}, 
                select: {
                    id: 'select_id',
                    class: 'select_class' 
                },
                options: {
                    BY_ATOMS: {render: true|false, id: '', class: '', selected: true|false, text:'label_text'},
                    BY_SPECTRUM: {render: true|false, id: '', class: '', selected: true|false, text:'label_text'},
                    BY_POLARITY: {render: true|false, id: '', class: '', selected: true|false, text:'label_text'},
                    BY_CHAINS: {render: true|false, id: '', class: '', selected: true|false, text:'label_text'},
                    BY_SEC_STRUCT: {render: true|false, id: '', class: '', selected: true|false, text:'label_text'},
                }
            }
         * @method addChangeColoringMethodListener
         * @param String|null coloringPanel id of DOM element containing radio buttons for coloring methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create coloring methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeColoringMethodListener: function(coloringPanel, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(coloringPanel == null) {
                coloringPanel = pv.createColoringMethodPanel(pv.createProteinColoringOptions('protein',options));
            }
            $('#'+coloringPanel).on('change', function(ev) {
                var coloring_by = $(this).val();
                pv.setColoringMethod(coloring_by);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+coloringPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing visualisation method of hetero atoms. If first argument is null, this function also creates radio buttons for visualisation methods.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'}, 
                options: {
                    BALL_AND_STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    ATOM: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}}
                }
            }
         * @method addChangeHeteroatomVisualisationMethodListener
         * @param String|null heteroatomMethodPanel id of DOM element containing radio buttons for visualisation methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create visualisation methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeHeteroatomVisualisationMethodListener: function(heteroatomMethodPanel, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(heteroatomMethodPanel == null) {
                heteroatomMethodPanel = pv.createVisualisationMethodPanel(pv.createHeteroatomVisualisationMethodPanelOptions(options));
            }
            $('#'+heteroatomMethodPanel).on('change', function(ev) {
                var method = $(':radio:checked', this).val();
                pv.setHeteroAtomVisualisationMethod(method);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+heteroatomMethodPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing coloring method of hetero atoms. If first argument is null, this function also creates radio buttons for coloring methods.
         * Options object should have structure like this:
         *  options = {}
         * @method addChangeColoringHeteroatomMethodListener
         * @param String|null coloringPanel id of DOM element containing radio buttons for coloring methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create coloring methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeColoringHeteroatomMethodListener: function(coloringPanel) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            $('#'+coloringPanel).on('change', function(ev) {
                var coloring_by = $(this).val();
                pv.setHeteroatomColoringMethod(coloring_by);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+coloringPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for show and hide hetero atoms checkbox. If first argument is null, this function also creates this checkbox.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'},
                render: true, 
                label: {id:'',class:'',text:'label_text'}, 
                input: {id:'input_id',class:'',name:'input_name'}
            }
         * @method addShowingHeteroatomListener
         * @param String|null showHeteroatom id of DOM element containing show/hide checkbox. If it is null, function creates this checkbox.
         * @param Object options object containing parameters to create show/hide checkbox. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addShowingHeteroatomListener: function(showHeteroatom, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(showHeteroatom == null) {
                showHeteroatom = pv.createShowButtonPanel(pv.createShowButtonPanelOptions('hetatom', options));
            }
            $('#'+showHeteroatom).on('change', function(ev) {
                var show = $(this).prop('checked');
                pv.setHeteroAtomVisualisation(show);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+showHeteroatom).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing visualisation method of solvent atoms. If first argument is null, this function also creates radio buttons for visualisation methods.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'}, 
                options: {
                    BALL_AND_STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    ATOM: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}}
                }
            }
         * @method addChangeSolventVisualisationMethodListener
         * @param String|null solventMethodPanel id of DOM element containing radio buttons for visualisation methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create visualisation methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeSolventVisualisationMethodListener: function(solventMethodPanel, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(solventMethodPanel == null) {
                solventMethodPanel = pv.createVisualisationMethodPanel(pv.createSolventVisualisationMethodPanelOptions(options));
            }
            $('#'+solventMethodPanel).on('change', function(ev) {
                var method = $(':radio:checked', this).val();
                pv.setSolventVisualisationMethod(method);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+solventMethodPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing coloring method of solvent atoms. If first argument is null, this function also creates radio buttons for coloring methods.
         * Options object should have structure like this:
         *  options = {}
         * @method addChangeColoringSolventMethodListener
         * @param String|null coloringPanel id of DOM element containing radio buttons for coloring methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create coloring methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeColoringSolventMethodListener: function(coloringPanel) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            $('#'+coloringPanel).on('change', function(ev) {
                var coloring_by = $(this).val();
                pv.setSolventColoringMethod(coloring_by);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+coloringPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for show and hide solvent atoms checkbox. If first argument is null, this function also creates this checkbox.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'},
                render: true, 
                label: {id:'',class:'',text:'label_text'}, 
                input: {id:'input_id',class:'',name:'input_name'}
            }
         * @method addShowingSolventListener
         * @param String|null showSolvent id of DOM element containing show/hide checkbox. If it is null, function creates this checkbox.
         * @param Object options object containing parameters to create show/hide checkbox. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addShowingSolventListener: function(showSolvent, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(showSolvent == null) {
                showSolvent = pv.createShowButtonPanel(pv.createShowButtonPanelOptions('solvent', options));
            }
            $('#'+showSolvent).on('change', function(ev) {
                var show = $(this).prop('checked');
                pv.setSolventVisualisation(show);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+showSolvent).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for changing visualisation method of side chain atoms. If first argument is null, this function also creates radio buttons for visualisation methods.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'}, 
                options: {
                    BALL_AND_STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}},
                    STICK: {render: true|false, checked: true|false, label: {id:'',class:'',text:'label_text'}, input: {id:'',class:'',name:'input_name'}}
                }
            }
         * @method addChangeSideChainVisualisationMethodListener
         * @param String|null sideChainMethodPanel id of DOM element containing radio buttons for visualisation methods. If it is null, function creates radio buttons using second parameter.
         * @param Object options object containing parameters to create visualisation methods radio buttons. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addChangeSideChainVisualisationMethodListener: function(sideChainMethodPanel, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(sideChainMethodPanel == null) {
                sideChainMethodPanel = pv.createVisualisationMethodPanel(pv.createSidechainVisualisationMethodPanelOptions(options));
            }
            $('#'+sideChainMethodPanel).on('change', function(ev) {
                var method = $(':radio:checked', this).val();
                pv.setSideChainVisualisationMethod(method);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            $('#'+sideChainMethodPanel).change();
            return proteinVisualisator;
        },
        /**
         * Function to add handler for show and hide side chain atoms checkbox. If first argument is null, this function also creates this checkbox.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'},
                render: true, 
                label: {id:'',class:'',text:'label_text'}, 
                input: {id:'input_id',class:'',name:'input_name'}
            }
         * @method addShowingSideChainListener
         * @param String|null showSideChain id of DOM element containing show/hide checkbox. If it is null, function creates this checkbox.
         * @param Object options object containing parameters to create show/hide checkbox. 
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addShowingSideChainListener: function(showSideChain, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            if(showSideChain == null) {
                showSideChain = pv.createShowButtonPanel(pv.createShowButtonPanelOptions('side_chain', options));
            }
            $('#'+showSideChain).on('change', function(ev) {
                var show = $(this).prop('checked');
                pv.setSideChainVisualisation(show);
                
                if(pv.isEmptyModel()) {
                    return;
                }
                pv.clearScene();
                pv.drawModel();
                pv.render();
            });
            return proteinVisualisator;
        },
        /**
         * Function to create show/hide DOM checkbox for part of model specify by first argument.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'div_id',class:'div_class'},
                render: true, 
                label: {id:'',class:'',text:'label_text'}, 
                input: {id:'input_id',class:'',name:'input_name'}
            }
         * @method createShowButtonControl
         * @param String part name of model's part which should be showing/hiding by this checkbox.
         * @param Object options object containing parameters to create show/hide checkbox. 
         * @return String id of created DOM element
         */
        createShowButtonControl: function(part, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            return pv.createShowButtonPanel(pv.createShowButtonPanelOptions(part, options));
        },
        /**
         * Function to create visualisation method DOM radio buttons for part of model specify by first argument.
         * Options object should have structure like this specified for part for which control panel should be created.
         * 
         * @method createVisualisationMethodControl
         * @param String part name of model's part which should be controlled by created panel.
         * @param Object options object containing parameters to create control panel. 
         * @return String id of created DOM element
         */
        createVisualisationMethodControl: function(part, options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            
            switch(part) {
                case 'protein':
                    options = pv.createProteinVisualisationMethodPanelOptions(options);
                    break;
                case 'hetatom':
                    options = pv.createHeteroatomVisualisationMethodPanelOptions(options);
                    break;
                case 'solvent':
                    options = pv.createSolventVisualisationMethodPanelOptions(options);
                    break;
                case 'side_chain':
                    options = pv.createSidechainVisualisationMethodPanelOptions(options);
                    break;
            }
            return pv.createVisualisationMethodPanel(options);
        },
        /**
         * Function to load data file located on server.
         * 
         * @method loadModel
         * @param String filePath path of file on server
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        loadModel: function(filePath) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            if( typeof filePath === "undefined" || filePath === null ) {
                return proteinVisualisator;
            }
            
            $.get(filePath, function(data) {
                data = new Blob([data]);
                pv.readFile(data);
            });
            
            return proteinVisualisator;
        },
        /**
         * Function to add event to handle load file from user local files. If first argument is null, this function also creates load file html element.
         * Options object should have structure like this:
         *  options = {
                parent: 'parent_selector',
                div: {id:'',class:''},
                file: {
                    id: 'file_id',
                    class: '',
                    name: 'file_name'
                }
            }
         * @method addLoadFilePanel
         * @param String|null filePanel id for html file element, if null this element will be created.
         * @param Object options attributes used to create html file element.
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        addLoadFilePanel: function(filePanel, options) {
            if( typeof _self === "undefined" ) {
                return;
            }
            var pv = _self;
            
            if(filePanel==null) {
                filePanel = pv.createLoadFilePanel(pv.createLoadFilePanelOptions(options));
            }
            $('#'+filePanel).on('change', pv.handleFileSelect);
            
            if(typeof options['default'] !== "undefined") {
                this.loadModel(options['default']);
            }
            return proteinVisualisator;
        },
        /**
         * Function to start rendering model. If any options passed it overwrites default ones.
         * 
         * @method render
         * @param Object options custom render options, like width and height of canvas.
         * @return ProteinVisualisator Function returns ProteinVisualisator object.
         */
        render: function(options) {
            if( typeof _self === "undefined" ) {
                return proteinVisualisator;
            }
            var pv = _self;
            if( typeof options !== "object" ) {
                options = {};
            }
            
            pv.updateRenderer(options);
            pv.updateCamera(options);
            pv.render();
            return proteinVisualisator;
        }
    };
    
    
    /** events **/
//    ProteinVisualisator.prototype.onMouseDown = function(e) {  // TODO: 
//        e.preventDefault();
//        
//        if( _self.modelObject.length > 0 ) {
//            var vector = new THREE.Vector3( //vector from camera to mouse
//                ( e.clientX / window.innerWidth ) * 2 - 1, 
//                - ( e.clientY / window.innerHeight ) * 2 + 1, 
//                0.5 
//            );
//            vector.unproject( _self.camera );
//            var raycaster = new THREE.Raycaster();
//            raycaster.set( _self.camera.position, vector.sub( _self.camera.position ).normalize() );
//            
//            var intersects = raycaster.intersectObjects( _self.modelObject[0].children );
//            
//            for( var i = 0; i < intersects.length; i++ ) {
//                var intersection = intersects[ i ],
//                    obj = intersection.object;
//console.log( obj );
//                obj.material.color.setRGB( 1.0 - i / intersects.length, 0, 0 );
//            }
//        }
//    };
    /**
     * Function to handle window resize event. Updates camera data.
     * 
     * @method onWindowResize
     * @param Event evt window resize event object
     */
    ProteinVisualisator.prototype.onWindowResize = function(evt) {
        if( typeof _self.options.resizable !== "undefined" ) {
            // TODO: change value in _self.options.width and _self.options.height
        }
        
        _self.renderer.setSize(_self.getWidth(), _self.getHeight());
        _self.camera.aspect = _self.getAspect();
        _self.camera.updateProjectionMatrix();
    };
    /**
     * Function to handle file select event. Performs reading loaded file.
     * 
     * @method onWindowResize
     * @param Event evt file select event object
     */
    ProteinVisualisator.prototype.handleFileSelect = function(evt) {
        var files = evt.target.files;
        if( !files.length ) {
            alert( 'Select file!' );
            return ;
        }
        var file = files[0]; 
        _self.prepareProteinModel([]);
        _self.readFile(file);
    };
    /**
     * Function to handle visualisation method change event. Performs drowing protein models.
     * 
     * @method handleVisualisationMethodChange
     * @param Event evt change visualisation method event object
     */
    ProteinVisualisator.prototype.handleVisualisationMethodChange = function(evt) {
        _self.clearScene();
        var method = $('#'+_self.options.methodPanel+' :radio[name=renderMethod]:checked').val();
        _self.setVisualisationMethod(method);
        _self.drawProtein();
        _self.render();
    };
    
    

    
    /**
     * Class to store atom informations.
     *
     * @class Atom
     */
    var Atom = function() {
        this.id;                     // Atom serial number.
        this.atomName;               // Atom name.
        this.altLoc;                 // Alternate location indicator.
        this.resName;                // Residue name.
        this.chainID;                // Chain identifier.
        this.resSeq;                 // Residue sequence number.
        this.iCode;                  // Code for insertion of residues.
        this.pos = {x:'',y:'',z:''}; // Orthogonal coordinates in Angstroms.
        this.occupancy;              // Occupancy.
        this.tempFactor;             // Temperature factor.
        this.segID;                  // Segment identifier, left-justified.
        this.element;                // Element symbol, right-justified.
        this.charge;                 // Charge on the atom.
        this.heteroAtom; 
        this.color;
        this.structure = {type:null, firstAtom:false, lastAtom:false};
        this.bonds = [];
        this.hydrBonds = [];
        this.saltBonds = [];
        this.bondsOrder = [];
        
        this.setBonds = function( bond ) {
            this.bonds.push( bond );
        };
        this.setBondsOrder = function( bond ) {
            this.bondsOrder.push( bond );
        };
        this.setSaltBonds = function( bond ) {
            this.saltBonds.push( bond );
        };
        this.setHydrBonds = function( bond ) {
            this.hydrBonds.push( bond );
        };
        this.setHeteroAtom = function( isHeteroAtom ) {
            this.heteroAtom = isHeteroAtom;
        };
        
        this.parseRecord = function( record ) {
            this.id          = parseInt(record.substr(6,5));
            this.atomName    = record.substr(12,4).trim(); 
            this.altLoc      = record.substr(16,1).trim(); 
            this.resName     = record.substr(17,3).trim(); 
            this.chainID     = record.substr(21,1).trim(); 
            this.resSeq      = parseInt(record.substr(22,4));
            this.iCode       = record.substr(26,1);
            this.pos.x       = parseFloat(record.substr(30,8)); 
            this.pos.y       = parseFloat(record.substr(38,8)); 
            this.pos.z       = parseFloat(record.substr(46,8)); 
            this.occupancy   = parseFloat(record.substr(54,6)); 
            this.tempFactor  = parseFloat(record.substr(60,6)); 
            this.segID       = record.substr(72,4).trim();      
            this.element     = record.substr(76,2).trim();      
            this.charge      = record.substr(78,2).trim();
        };
    };
    /**
     * Class to store helix informations.
     *
     * @class Helix
     */
    var Helix = function() {
        // HELIX TYPES:
        this.RIGHT_HENDED_ALPHA = 1; // Right-handed alpha (default)   
        this.RIGHT_HENDED_OMEGA = 2;  // Right-handed omega          
        this.RIGHT_HENDED_PI = 3;    // Right-handed pi            
        this.RIGHT_HENDED_GAMMA = 4; // Right-handed gamma        
        this.RIGHT_HENDED_310 = 5;   // Right-handed 310          
        this.LEFT_HENDED_ALPHA = 6;  // Left-handed alpha      
        this.LEFT_HENDED_OMEGA = 7;  // Left-handed omega    
        this.LEFT_HENDED_GAMMA = 8;  // Left-handed gamma  
        this.RIBBON = 9;             // 27 ribbon/helix    
        this.POLYPROLINE = 10;       // Polyproline    

        this.serNum;            // Serial number of the helix. This starts at 1 and increases incrementally.
        this.helixID;           // Helix identifier.  In addition to a serial number, each helix is given an alphanumeric character helix identifier.
        this.initResName;       // Name of the initial residue.
        this.initChainID;       // Chain identifier for the chain containing this helix.
        this.initSeqNum;        // Sequence number of the initial residue.
        this.initICode;         // Insertion code of the initial residue.
        this.endResName;        // Name of the terminal residue of the helix.
        this.endChainID;        // Chain identifier for the chain containing this helix.
        this.endSeqNum;         // Sequence number of the terminal residue.
        this.endICode;          // Insertion code of the terminal residue.
        this.helixClass;        // Helix class (see below).
        this.comment;           // Comment about this helix.
        this.length;            // Length of this helix.
        
        
        this.parseRecord = function( record ) {
            this.serNum         = parseInt(record.substr(7,3));
            this.helixID        = record.substr(11,3).trim();
            this.initResName    = record.substr(15,3).trim();
            this.initChainID    = record.substr(19,1);
            this.initSeqNum     = parseInt(record.substr(21,4));
            this.initICode      = record.substr(25,1);
            this.endResName     = record.substr(27,3).trim();
            this.endChainID     = record.substr(31,1);
            this.endSeqNum      = parseInt(record.substr(33,4));
            this.endICode       = record.substr(37,1);
            this.helixClass     = parseInt(record.substr(38,2));
            this.comment        = record.substr(40,30); 
            this.length         = parseInt(record.substr(71,5)); 
        };
    };
    /**
     * Class to store turns informations.
     *
     * @class Turn
     */
    var Turn = function() {
        this.seq;               // Turn number; starts with 1 and increments by one.
        this.turnId;            // Turn identifier
        this.initResName;       // Residue name of initial residue in turn.
        this.initChainId;       // Chain identifier for the chain containing this turn.
        this.initSeqNum;        // Sequence number of initial residue in turn.
        this.initICode;         // Insertion code of initial residue in turn.
        this.endResName;        // Residue name of terminal residue of turn.
        this.endChainID;        // Chain identifier for the chain containing this turn.
        this.endSeqNum;         // Sequence number of terminal residue of turn.
        this.endICode;          // Insertion code of terminal residue of turn.
        this.comment;           // Associated comment.
        
        
        
        this.parseRecord = function( record ) {
            this.serNum         = parseInt(record.substr(7,3));
            this.turnId         = record.substr(11,3).trim();
            this.initResName    = record.substr(15,3).trim();
            this.initChainID    = record.substr(19,1);
            this.initSeqNum     = parseInt(record.substr(20,4));
            this.initICode      = record.substr(24,1);
            this.endResName     = record.substr(26,3).trim();
            this.endChainID     = record.substr(30,1);
            this.endSeqNum      = parseInt(record.substr(31,4));
            this.endICode       = record.substr(35,1);
            this.comment        = record.substr(40); 
        };
    };
    /**
     * Class to store beta sheet informations.
     *
     * @class Sheet
     */
    var Sheet = function() {
        this.strand;      // Strand number.
        this.sheetID;     // Sheet identifier.
        this.numStrands;  // Number of strands in sheet.
        this.initResName; // Residue name of initial residue.
        this.initChainID; // Chain identifier of initial residue in strand.
        this.initSeqNum;  // Sequence number of initial residue in strand.
        this.initICode;   // Insertion code of initial residue in strand.
        this.endResName;  // Residue name of terminal residue.
        this.endChainID;  // Chain identifier of terminal residue.
        this.endSeqNum;   // Sequence number of terminal residue.
        this.endICode;    // Insertion code of terminal residue.
        this.sense;       // Sense of strand with respect to previous strand in the sheet. 0 if first strand, 1 if parallel, -1 if anti-parallel.
        this.curAtom;     // Registration. Atom name in current strand.
        this.curResName;  // Registration. Residue name in current strand.
        this.curChainId;  // Registration. Chain identifier in current strand.
        this.curResSeq;   // Registration. Residue sequence number in current strand.
        this.curICode;    // Registration. Insertion code in current strand.
        this.prevAtom;    // Registration. Atom name in previous strand.
        this.prevResName; // Registration. Residue name in previous strand.
        this.prevChainId; // Registration. Chain identifier in previous strand.
        this.prevResSeq;  // Registration. Residue sequence number in previous strand.
        this.prevICode;   // Registration. Insertion code in previous strand.
        
        
        this.parseRecord = function( record ) {
            this.strand      = parseInt(record.substr(7,3));   
            this.sheetID     = record.substr(11,3).trim();     
            this.numStrands  = parseInt(record.substr(14,2));  
            this.initResName = record.substr(17,3).trim();     
            this.initChainID = record.substr(21,1).trim();     
            this.initSeqNum  = parseInt(record.substr(22,4));  
            this.initICode   = record.substr(26,1);            
            this.endResName  = record.substr(28,3).trim();     
            this.endChainID  = record.substr(32,1);          
            this.endSeqNum   = parseInt(record.substr(33,4));
            this.endICode    = record.substr(37,1);          
            this.sense       = parseInt(record.substr(38,2));
            this.curAtom     = record.substr(41,4).trim();   
            this.curResName  = record.substr(45,3).trim();   
            this.curChainId  = record.substr(49,1);          
            this.curResSeq   = parseInt(record.substr(50,4));
            this.curICode    = record.substr(54,1);          
            this.prevAtom    = record.substr(56,4).trim();   
            this.prevResName = record.substr(60,3).trim();   
            this.prevChainId = record.substr(64,1);          
            this.prevResSeq  = parseInt(record.substr(65,4));
            this.prevICode   = record.substr(69,1); 
        };
    };
    
    /**
     * Function to load translated string for given key from internationalisation js files.
     *
     * @method __
     * @param String key key in internationalisation file
     * @param String langiage language in which should be returned string
     * @return String translated string from internationalisation file
     */
    var __ = function(key, language) {
        if(typeof language === "undefined") {
            language = window.navigator.userLanguage || window.navigator.language;
        }
        if(typeof i18n[language] === "undefined") {
            return i18n['default'][key];
        }
        if(typeof i18n[language][key] === "undefined") {
            return key;
        }
        return i18n[language][key];
    }
    
    
    return proteinVisualisator;
}());