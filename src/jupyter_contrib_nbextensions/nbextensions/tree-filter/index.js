/*
 * Based on https://github.com/jdfreder/jupyter-tree-filter.git
 */

define([
    'require',
    'jqueryui',
    'base/js/namespace',
    'base/js/utils',
    'services/config'
], function (
    requirejs,
    $,
    Jupyter,
    utils,
    configmod
) {
    'use strict';

    var base_url = utils.get_body_data("baseUrl");
    var config = new configmod.ConfigSection('tree', {base_url: base_url});

    config.loaded.then(function() {
        if (config.data.hasOwnProperty('filter_keyword')) {
            var filter_keyword = config.data.filter_keyword;
            if (filter_keyword) {
                console.log("filter_keyword:", filter_keyword);
                $('#filterkeyword').val(filter_keyword);
                filterRows(filter_keyword);
            }
        }
    });

    function filterRows (filterText, caseSensitive, useRegex) {
        var input = $('#filterkeyword');
        var btnRegex = $('#filterisreg');

        filterText = filterText !== undefined ? filterText : input.val();
        useRegex = useRegex !== undefined ? useRegex : btnRegex.attr('aria-pressed') === 'true';
        caseSensitive = caseSensitive !== undefined ? caseSensitive : $('#filtercase').attr('aria-pressed') === 'true';

        if (!useRegex) {
            // escape any regex special chars
            filterText = filterText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
        }
        var matchExpr;
        try {
            matchExpr = new RegExp(filterText, caseSensitive ? '' : 'i');
        }
        catch (err) {
            // do nothing, error is handled based on undefined matchExpr
        }

        var invalidRegex = matchExpr === undefined;
        btnRegex.toggleClass('btn-danger', invalidRegex);
        btnRegex.toggleClass('btn-default', !invalidRegex);
        btnRegex.closest('.form-group').toggleClass('has-error has-feedback', invalidRegex);

        var rows = Array.prototype.concat.apply([], document.querySelectorAll('.list_item.row'));
        rows.forEach(function (row) {
            // Below code (guards) fixes an undefined textContent error
            var itemName = row.querySelector('.item_name');
            if (itemName && itemName.textContent) {
                if (!filterText) {
                    // if there is no filter then show them all
                    row.style.display = ''; //show
                } else {
                    // search(matchExpr) === -1 means not found ==> hide then
                    if (itemName.textContent.search(matchExpr) === -1) {
                        row.style.display = 'none'; //hide
                    } else {
                        row.style.display = ''; //show
                    }
                }
            } else {
                // No item_name found so show just in case
                row.style.display = ''; //show
            }
        });
    }

    function filterRowsDefaultParams () {
        return filterRows();
    }

    function load_ipython_extension () {

        var form = $('<form/>')
            .css('padding', '0 7px 4px')
            .appendTo('#notebook_list_header');

        var frm_grp = $('<div/>')
            .addClass('form-group')
            .css('margin-bottom', 0)
            .appendTo(form);

        var grp = $('<div/>')
            .addClass('input-group')
            .appendTo(frm_grp);

        $('<input/>')
            .attr('type', 'text')
            .addClass('form-control input-sm')
            .attr('title', 'Keyword for filtering tree')
            .attr('id', 'filterkeyword')
            .attr('placeholder', 'Filter')
            .css('font-weight', 'bold')
            .appendTo(grp);

        var btns = $('<div/>')
            .addClass('input-group-btn')
            .appendTo(grp);

        $('<button/>')
            .attr('type', 'button')
            .attr('id', 'filterisreg')
            .addClass('btn btn-default btn-sm')
            .attr('data-toggle', 'button')
            .css('font-weight', 'bold')
            .attr('title', 'Use regex (JavaScript regex syntax)')
            .text('.*')
            .on('click', function (evt) { setTimeout(filterRowsDefaultParams); })
            .appendTo(btns);

        $('<button/>')
            .attr('type', 'button')
            .attr('id', 'filtercase')
            .addClass('btn btn-default btn-sm')
            .attr('data-toggle', 'button')
            .attr('tabindex', '0')
            .attr('title', 'Match case')
            .css('font-weight', 'bold')
            .text('Aa')
            .on('click', function (evt) { setTimeout(filterRowsDefaultParams); })
            .appendTo(btns);

        $('#filterkeyword').on('keyup', filterRowsDefaultParams);

        // Hook into sessions reload else the filter gets cleared
        // https://github.com/jupyter/notebook/blob/master/notebook/static/base/js/events.js
        // https://github.com/ipython/ipython/wiki/Dev:-Javascript-Events#dashboard-related-events
        $([IPython.events]).on('draw_notebook_list.NotebookList', filterRowsDefaultParams);
        // $([IPython.events]).on('app_initialized.DashboardApp', filterRowsDefaultParams);
        // $([IPython.events]).on('sessions_loaded.Dashboard', filterRowsDefaultParams);

        config.load();
    }

    return {
        load_ipython_extension : load_ipython_extension
    };

});
