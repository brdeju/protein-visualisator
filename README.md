# protein-visualisator
ProteinVisualisator javascript library to create interactive 3-dimensional model of protein molecule.


REQUIREMENTS:

ThreeJS r71, Projector, OrbitControls, jQuery v1.11.2, modernizr v2.8.3
All of these files are included into project.

INSTALL:

In your html file add requirements files:
<code>
<script src="js/vendor/three.min.js"></script>
<script src="js/vendor/Projector.js"></script>
<script src="js/vendor/OrbitControls.js"></script>
</code>
library files:
<script src="js/vendor/pv/i18n.js"></script>
<script src="js/vendor/pv/ProteinVisualisator.js"></script>

To initialise library use:
var pv = ProteinVisualisator.init('div.canvas'); // div.canvas is selector of HTML DOM element div
To load model from server use:
pv.loadModel('2POR.pdb'); // 2POR.pdb is PDB formated file on your server

For more information read documentation:
http://fatcat.ftj.agh.edu.pl/~i0brdej/mgr/doc

or see example:
http://fatcat.ftj.agh.edu.pl/~i0brdej/mgr/


Created by Brdej Grzegorz, 2015.
