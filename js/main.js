(function(){
var pv = null;
$(window).ready(function() {
    pv = ProteinVisualisator.init('div.canvas',{id:'test_id',name:'test_name',class:'test_class'});
    if(pv) {
        pv.addLoadFilePanel(null,{parent:'config', default:'2POR.pdb'})
            .addChangeColoringMethodListener(null,{parent:'protein-config',select:{class:'col-md-12'}});
        var proteinMethod = pv.createVisualisationMethodControl('protein',{parent:'protein-config'});
        pv.addChangeVisualisationMethodListener(proteinMethod);
    
        pv.addChangeHeteroatomVisualisationMethodListener(null,{parent:'hetatom-config'});
        
        var show = pv.createShowButtonControl('hetatom',{parent:'hetatom-config'});
        pv.addShowingHeteroatomListener(show)
            .addChangeSolventVisualisationMethodListener(null,{parent:'solvent-config'})
            .addShowingSolventListener(null,{parent:'solvent-config'})
            .addChangeSideChainVisualisationMethodListener(null,{parent:'sidechain-config'})
            .addShowingSideChainListener(null,{parent:'sidechain-config'})
            .render({width:1200,height:800});
    
//        pv.loadModel('2POR.txt');
//        pv.startAutoRotate({rotate:true,speed:2});
    }
});
})();