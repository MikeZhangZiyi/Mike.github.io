+++
date = '2026-03-09T16:09:29+08:00'
draft = false
title = 'Learning and Practice of Single-Cell Sequencing'
+++
<div style="
  text-align: justify;    
  line-height: 1.6;       
  hyphens: auto;          
  word-break: break-all;  
  max-width: 100%;        
">


# Materials and Methods
## Learning Resources and Workflow Design

To design an appropriate analysis workflow, the overall strategy was developed based on the guidelines provided by Single Cell Best Practices [^1], with particular emphasis on rigorous data quality assessment, batch effect evaluation, and flexible downstream analysis.

<figure id="fig-sc-workflow" style="float:right; width:420px; margin-left:20px;">
  <img src="https://raw.githubusercontent.com/MikeZhangZiyi/blog/refs/heads/main/public/posts/Single%20Cell/single_cell_workflow_even_bigger.png">
  <figcaption style="color:black;">
    <strong>Figure 1.</strong> Overview of the single-cell RNA-seq analysis workflow including preprocessing,
    normalization, dimensionality reduction, clustering, and cell-type annotation.
  </figcaption>
</figure>

At the beginning of the analysis, potential batch effects were systematically assessed using exploratory data visualization and metadata inspection. This initial evaluation determined whether samples originated from multiple batches or experimental conditions that could introduce technical variation. Based on this assessment, one of two alternative analysis workflows was selected.

When clear batch effects were detected, a latent variable-based integration strategy was adopted using scvi-tools. Specifically, scVI was first applied to learn a batch-corrected latent representation directly from raw count data. To enable reliable cell type annotation, a subset of high-confidence cells was annotated using CellTypist on a log-normalized and highly variable gene-filtered copy of the data. These high-confidence labels were then used to initialize scANVI, which performed semi-supervised learning to propagate cell type annotations across the full dataset while preserving batch correction.

In contrast, when no obvious batch effects were observed, a standard analysis pipeline was employed. This workflow included quality control, normalization, highly variable gene selection, principal component analysis (PCA), neighborhood graph construction, and clustering using the Leiden algorithm. Cell type annotation was subsequently performed using either automated prediction with CellTypist or manual validation against canonical marker genes, depending on data complexity and annotation confidence.

The overall workflow design, including both branches (with and without batch effects), is illustrated in Figure<sup>[1](#fig-sc-workflow)</sup>. This adaptive workflow design enabled the selection of the most appropriate analytical strategy according to dataset characteristics, ensuring robust batch integration, reliable cell type annotation, and analytical consistency across different single-cell datasets processed during the study.

## Immune Cell Dataset

The immune cell dataset used in this training was derived from a publicly available 10x Genomics Multiome dataset generated for a single-cell data integration challenge at the NeurIPS 2021 conference[^2]. The dataset consists of single-cell multiomic profiles from human bone marrow mononuclear cells collected from 12 healthy donors and measured at four different experimental sites, thereby introducing nested batch effects at the full dataset level.

In this study, only a single subset of the dataset—sample 4 from donor 8—was used for downstream analysis. As this subset originates from a single donor and a single experimental site, no explicit batch effects were expected within the selected data. This subset was therefore suitable for demonstrating standard scRNA-seq preprocessing and downstream analysis following best practices.

Despite the absence of apparent batch effects, two analytical strategies were applied to this dataset. First, a conventional scRNA-seq workflow based on principal component analysis (PCA) was performed to establish a baseline analysis and cell type annotation. In parallel, a latent variable–based workflow using scVI and scANVI was also applied. This additional analysis was conducted for methodological exploration and to ensure familiarity with batch-aware and semi-supervised modeling approaches, even in scenarios where batch correction is not strictly required.

By applying both workflows to the same immune cell dataset, this analysis provided a direct comparison of standard and deep learning–based approaches and served as a controlled benchmark for evaluating the behavior of scVI and scANVI under minimal batch effect conditions.

## Human Brain Infection Dataset

To further evaluate the applicability of the analysis workflow to a more complex biological context, a human brain infection–related single-cell RNA sequencing dataset was independently selected from a publicly available resource (GSE309815)[^3]. This dataset was generated using undirected human cerebral organoids derived from induced pluripotent stem cells (hiPSCs) and was designed to model neural development and host responses to viral infection in vitro.

The organoids were cultured in spinning bioreactors and divided into three experimental groups, including two infection conditions (MV1-infected and MV2-infected) and an uninfected control group (NBH). Each group was sampled at two 120 and 180 days post-infection, resulting in multiple experimental conditions across infection subtype. Single-cell RNA-seq libraries were prepared using the 10x Genomics Chromium Next GEM Single Cell 3' platform and sequenced on an Illumina NovaSeq 6000 system.

Due to the presence of multiple infection conditions, this dataset was expected to exhibit both biological variability and potential batch effects. Therefore, it provided an appropriate test case for applying batch-aware integration and semi-supervised annotation strategies. The same workflow design principles established during the immune cell analysis were applied to this dataset, including initial quality control, batch effect assessment, and the selection of either a standard PCA-based pipeline or a latent variable–based approach using scVI and scANVI.

This dataset enabled the exploration of infection-associated transcriptional changes in neural cell populations and served as a realistic and biologically meaningful example for testing the robustness and flexibility of the single-cell analysis workflow.

[^1]: HEUMOS L, SCHAAR A C, LANCE C, et al. Best practices for single-cell analysis across modalities[J/OL]. Nature Reviews Genetics, 2023, 24(8): 550-572. [https://oi.org/10.1038/s41576-023-00586-w](https://oi.org/10.1038/s41576-023-00586-w). DOI: [10.1038/s41576-023-00586-w](10.1038/s41576-023-00586-w).

[^2]: LUECKENMD, BURKHARDT D B, CANNOODT R, et al. A sandbox for prediction and integration of DNA, RNA, and proteins in single cells[COL]//Thirty-fifth Conference on Neural Information Processing Systems Datasets and Benchmarks Track (Round 2). 2021. [https://openreview.net/forum?id=gN35BGa1Rt](https://openreview.net/forum?id=gN35BGa1Rt).

[^3]: Single-cell RNA-seq of human cerebral organoids under infection conditions[EB/OL]. 2024. [https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE309815](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE309815).