import { useState, useEffect, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    IndexTable,
    useIndexResourceState,
    Text,
    Thumbnail,
    Pagination,
    Icon,
    LegacyCard,
    Grid,
    Select,
    Filters,
    Badge,
    Modal,
    Button,
    ButtonGroup,
    TextField,
    Checkbox,
} from "@shopify/polaris";
import { StarFilledIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import apiClient from "../services/api";

interface ReviewMedia {
    id: number;
    mediaUrl: string;
    mediaType: string;
}

interface Review {
    id: number;
    shop: string;
    productId: string;
    productName: string;
    customerName: string;
    rating: number;
    comment: string;
    media: ReviewMedia[];
    status: string; // Updated to match Enum (PUBLISHED, HIDDEN, ARCHIVED)
    hideReason: string | null;
    createdAt: string;
    replyNum: number;
    unreadReplyCount: number;
    isRead: boolean;
}

interface ReviewStats {
    totalReviews: number;
    averageRating: number;
    oneStar: number;
    twoStars: number;
    threeStars: number;
    fourStars: number;
    fiveStars: number;
    unReadReview?: number;
}

const ExpandableComment = ({ text, maxLength = 200, isExpanded, onToggle }: { 
    text: string; 
    maxLength?: number;
    isExpanded: boolean;
    onToggle: () => void;
}) => {
    if (!text) return <Text tone="subdued" as="span" variant="bodyMd">No comment</Text>;
    if (text.length <= maxLength) return <Text variant="bodyMd" as="p">{text}</Text>;

    return (
        <div>
            <Text variant="bodyMd" as="p">
                {isExpanded ? text : `${text.substring(0, maxLength)}...`}
                <span style={{ marginLeft: '4px' }}>
                    <Button
                        variant="plain"
                        size="micro"
                        onClick={onToggle}
                    >
                        {isExpanded ? "Show less" : "See more"}
                    </Button>
                </span>
            </Text>
        </div>
    );

};

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [ratingFilter, setRatingFilter] = useState<string>("");
    const [productSearch, setProductSearch] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [readFilter, setReadFilter] = useState<string>("");
    const [hideReasons, setHideReasons] = useState<{ label: string, value: string }[]>([]);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [selectedHideReason, setSelectedHideReason] = useState<string>("");
    const [currentReview, setCurrentReview] = useState<Review | null>(null);
    const [updating, setUpdating] = useState<number | null>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const [isRepliesModalOpen, setIsRepliesModalOpen] = useState(false);
    const [replies, setReplies] = useState<Review[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [parentForReplies, setParentForReplies] = useState<Review | null>(null);

    // Expansion tracking
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Reply selection tracking
    const [selectedReplies, setSelectedReplies] = useState<string[]>([]);

    const fetchReviews = useCallback(async (pageIndex = 0, ratingVal = "", productVal = "", statusVal = "", readVal = "") => {
        setLoading(true);
        try {
            const params: any = { page: pageIndex, size: 10 };
            if (ratingVal) params.rating = parseInt(ratingVal);
            if (productVal) {
                // If it looks like a numeric ID (Liquid ID or Database ID usually long), 
                // but let's just pass it as productName/productId to search
                params.productName = productVal;
                // Backend specification uses .like filter for productName
            }
            if (statusVal === 'PUBLISHED') params.status = true;
            else if (statusVal === 'HIDDEN') params.status = false;
            
            if (readVal === 'READ') params.isRead = true;
            else if (readVal === 'UNREAD') params.isRead = false;

            const response = await apiClient.get(`/reviews`, { params });
            const payload = response.data;
            if (payload && payload.content) {
                setReviews(payload.content);
                setTotalPages(payload.totalPages);
            }
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        } finally {
            setLoading(false);
        }
    }, []);


    const fetchHideReasons = async () => {
        try {
            const res = await apiClient.get("/reviews/hide-reasons");
            if (res.data) {
                setHideReasons(res.data);
            }
        } catch (e) {
            console.error("Failed to fetch hide reasons", e);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await apiClient.get("/reviews/stats");
            const payload = res.data;
            console.log("Stats payload:", payload);
            if (payload && (typeof payload.totalReviews === 'number' || typeof payload.totalReviews === 'string')) {
                setStats(payload);
            }
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };

    useEffect(() => {
        fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
    }, [page, ratingFilter, productSearch, statusFilter, readFilter, fetchReviews]);

    useEffect(() => {
        fetchStats();
        fetchHideReasons();
    }, []);

    const handleMarkAsRead = async (ids: number[]) => {
        // Optimistic update
        setReviews(prev => prev.map(r => 
            ids.includes(r.id) ? { ...r, isRead: true } : r
        ));

        try {
            await apiClient.put("/reviews/read", ids);
            // No need to fetchReviews here as we updated optimistically, 
            // but we fetch stats to keep them in sync
            fetchStats();
        } catch (e) {
            console.error("Failed to mark as read", e);
            // Rollback if needed (for simplicity, we usually refresh on error)
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
        }
    };

    const handleMarkRepliesAsRead = async (ids: number[]) => {
        // Optimistic update for unread count
        if (parentForReplies) {
            setReviews(prev => prev.map(r => 
                r.id === parentForReplies.id 
                ? { ...r, unreadReplyCount: Math.max(0, r.unreadReplyCount - ids.length) } 
                : r
            ));
        }

        try {
            await apiClient.put("/reviews/read-reply", ids);
            // Refresh stats to keep counts accurate
            fetchStats();
        } catch (e) {
            console.error("Failed to mark replies as read", e);
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
        }
    };

    const handleRatingChange = (value: string) => {
        setRatingFilter(value);
        setPage(0);
    };

    const handleProductChange = (value: string) => {
        setProductSearch(value);
        setPage(0);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setPage(0);
    };

    const handleReadChange = (value: string) => {
        setReadFilter(value);
        setPage(0);
    };

    const handleViewReplies = async (parentReview: Review, isReadFilter?: boolean) => {
        console.log("Viewing replies for:", parentReview.id, "Filter isRead:", isReadFilter);
        setParentForReplies(parentReview);
        setIsRepliesModalOpen(true);
        setLoadingReplies(true);
        setExpandedId(null); // Reset expansion for new list
        setSelectedReplies([]); // Reset selection for new list
        try {
            const params: any = {};
            if (isReadFilter !== undefined) {
                params.isRead = isReadFilter;
            }
            
            const res = await apiClient.get(`/reviews/${parentReview.id}/replies`, {
                params
            });
            console.log("Replies response:", res.data);
            
            // Mark parent as read when viewing replies
            if (!parentReview.isRead) {
                handleMarkAsRead([parentReview.id]);
            }

            // apiClient unwraps the response, so res.data is already the array of reviews (List<ProductReview>)
            const replyData = Array.isArray(res.data) ? res.data : [];
            setReplies(replyData);
        } catch (e) {
            console.error("Failed to fetch replies", e);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleCloseRepliesModal = async () => {
        const selectedIds = [...selectedReplies];
        if (selectedIds.length > 0) {
            const idsNum = selectedIds.map(id => parseInt(id));
            // Trigger API call but don't await it to close modal immediately
            handleMarkRepliesAsRead(idsNum);
        }
        setIsRepliesModalOpen(false);
        setSelectedReplies([]);
    };

    const handleRepliesSelectionChange = (selectionType: any, isSelected: boolean, id?: string) => {
        if (selectionType === 'all') {
            // Only allow selecting unread items for "mark as read" purpose
            setSelectedReplies(isSelected ? replies.filter(r => !r.isRead).map(r => r.id.toString()) : []);
        } else if (id) {
            setSelectedReplies(prev => isSelected ? [...prev, id] : prev.filter(i => i !== id));
        }
    };

    const handleToggleStatus = async (review: Review, isFromReplies = false) => {
        if (review.status === 'PUBLISHED') {
            // If currently published -> Hide
            setCurrentReview(review);
            setSelectedHideReason(hideReasons[0]?.value || "");
            setIsHideModalOpen(true);
        } else {
            // If currently hidden -> Publish
            await updateReviewStatus(review.id, 'PUBLISHED', undefined, isFromReplies);
        }
    };

    const updateReviewStatus = async (id: number, status: string, hideReason?: string, isFromReplies = false) => {
        setUpdating(id);
        try {
            await apiClient.put("/reviews", {
                id,
                status,
                hideReason
            });
            
            if (isFromReplies && parentForReplies) {
                // Refresh replies list inside modal
                handleViewReplies(parentForReplies);
            }
            
            // Refresh main data
            fetchReviews(page, ratingFilter, productSearch, statusFilter, readFilter);
            fetchStats();
        } catch (e) {
            console.error("Failed to update status", e);
        } finally {
            setUpdating(null);
        }
    };

    const handleHideConfirm = async () => {
        if (currentReview) {
            const isReply = currentReview.replyNum === undefined; // Check if it's a reply by existence of field or value
            // Actually, in our Review interface, replyNum exists. But for replies it might be 0 or undefined if backend doesn't send it.
            // Let's use a more reliable check if we are in replies modal context.
            const isFromReplies = isRepliesModalOpen && replies.some(r => r.id === currentReview.id);

            await updateReviewStatus(currentReview.id, 'HIDDEN', selectedHideReason, isFromReplies);
            setIsHideModalOpen(false);
            setCurrentReview(null);
        }
    };

    const resourceName = { singular: "review", plural: "reviews" };
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(reviews as unknown as { [key: string]: unknown; id: string }[]);

    const rowMarkup = reviews.map(
        (review, index) => {
            const { id, customerName, rating, comment, createdAt, productName, media, status, shop, hideReason, replyNum, unreadReplyCount, isRead } = review;
            const displayRating = rating || 0;
            const isPublished = status === 'PUBLISHED';
            const isHidden = status === 'HIDDEN';
            const rowStyle = isRead ? { opacity: 0.7, filter: 'grayscale(0.5)' } : { backgroundColor: '#f9f9f9' };

            return (
                <IndexTable.Row
                    id={id.toString()}
                    key={id}
                    selected={selectedResources.includes(id.toString())}
                    position={index}
                    disabled={isRead}
                    tone={isRead ? "subdued" : undefined}
                >
                    <IndexTable.Cell>
                        <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Text variant="bodyMd" fontWeight={isRead ? "medium" : "bold"} as="span" tone={isRead ? "subdued" : "base"}>
                                {customerName || 'Anonymous'}
                            </Text>
                            {isRead ? (
                                <Icon source={CheckCircleIcon} tone="success" />
                            ) : (
                                <span style={{ width: '8px', height: '8px', backgroundColor: '#008060', borderRadius: '50%', display: 'inline-block' }} title="New/Unread" />
                            )}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Text variant="bodyMd" as="span">{productName || 'Unknown Product'}</Text>
                    </IndexTable.Cell>
                    
                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                            {/* Rating */}
                            {displayRating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#fbbf24', display: 'flex' }}>
                                        {[...Array(displayRating)].map((_, i) => (
                                            <Icon key={i} source={StarFilledIcon} tone="warning" />
                                        ))}
                                    </span>
                                </div>
                            )}

                            {/* Media */}
                            {media && media.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {media.slice(0, 3).map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => setZoomedImage(m.mediaUrl)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Thumbnail
                                                source={m.mediaType === "IMAGE" ? m.mediaUrl : ""}
                                                alt="media"
                                                size="large"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                             {/* Reply Counts & Action */}
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                <div 
                                    onClick={() => handleViewReplies(review, undefined)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Badge tone="info" size="small">{`${replyNum || 0} Replies`}</Badge>
                                </div>
                                {unreadReplyCount > 0 && (
                                    <div 
                                        onClick={() => handleViewReplies(review, false)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Badge tone="attention" size="small">{`${unreadReplyCount} Unread`}</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ whiteSpace: 'normal', minWidth: '300px', maxWidth: '550px', wordBreak: 'break-word' }}>
                           <ExpandableComment 
                                text={comment} 
                                isExpanded={expandedId === `review-${id}`}
                                onToggle={() => setExpandedId(expandedId === `review-${id}` ? null : `review-${id}`)}
                           />
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: 'max-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Badge tone={isPublished ? 'success' : 'critical'}>
                                    {isPublished ? 'Published' : 'Hidden'}
                                </Badge>
                                <Button
                                    size="micro"
                                    onClick={() => handleToggleStatus(review)}
                                    loading={updating === id}
                                >
                                    {isPublished ? "Hide" : "Publish"}
                                </Button>
                            </div>
                            {isHidden && hideReason && (
                                <Badge tone="warning" size="small">
                                    {`Reason: ${hideReason}`}
                                </Badge>
                            )}
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Checkbox
                                label=""
                                checked={isRead}
                                disabled={isRead}
                                onChange={() => handleMarkAsRead([id])}
                            />
                        </div>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <div style={{ width: 'max-content' }}>
                            {new Date(createdAt).toLocaleDateString()}
                        </div>
                    </IndexTable.Cell>
                </IndexTable.Row>
            );
        }
    );

    const filters = [
        {
            key: 'rating',
            label: 'Rating',
            filter: (
                <Select
                    label="Rating"
                    labelInline
                    options={[
                        { label: 'All Ratings', value: '' },
                        { label: '5 Stars', value: '5' },
                        { label: '4 Stars', value: '4' },
                        { label: '3 Stars', value: '3' },
                        { label: '2 Stars', value: '2' },
                        { label: '1 Star', value: '1' },
                    ]}
                    value={ratingFilter}
                    onChange={handleRatingChange}
                />
            ),
            shortcut: true,
        },
    ];

    return (
        <Page title="Product Reviews" fullWidth>
            <Layout>
                {/* Statistics Section */}
                {stats && (
                    <Layout.Section>
                        <Grid>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Total Reviews</Text>
                                    <Text variant="heading2xl" as="p">{stats.totalReviews}</Text>
                                </LegacyCard>
                            </Grid.Cell>
                            
                            {stats.unReadReview !== undefined && (
                                <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                    <LegacyCard sectioned>
                                        <Text variant="headingSm" as="h6">Unread Reviews</Text>
                                        <Text variant="heading2xl" tone="critical" as="p">{stats.unReadReview}</Text>
                                    </LegacyCard>
                                </Grid.Cell>
                            )}

                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Average Rating</Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Text variant="heading2xl" as="p">{stats.averageRating}</Text>
                                        <div style={{ transform: 'scale(2)', transformOrigin: 'left center' }}>
                                            <Icon source={StarFilledIcon} tone="warning" />
                                        </div>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                            <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 3, xl: 3 }}>
                                <LegacyCard sectioned>
                                    <Text variant="headingSm" as="h6">Breakdown</Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '13px' }}>
                                        <Badge tone="success">{`5★: ${stats.fiveStars}`}</Badge>
                                        <Badge tone="info">{`4★: ${stats.fourStars}`}</Badge>
                                        <Badge>{`3★: ${stats.threeStars}`}</Badge>
                                        <Badge tone="attention">{`2★: ${stats.twoStars}`}</Badge>
                                        <Badge tone="critical">{`1★: ${stats.oneStar}`}</Badge>
                                    </div>
                                </LegacyCard>
                            </Grid.Cell>
                        </Grid>
                    </Layout.Section>
                )}

                <Layout.Section>
                    <Card padding="0">
                        <div style={{ padding: '16px', borderBottom: '1px solid #e1e3e5', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                            <div style={{ flex: '2', minWidth: '200px' }}>
                                <TextField
                                    label="Search Product Name or ID"
                                    value={productSearch}
                                    onChange={handleProductChange}
                                    autoComplete="off"
                                    placeholder="e.g. T-shirt"
                                    clearButton
                                    onClearButtonClick={() => handleProductChange("")}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Rating"
                                    options={[
                                        { label: 'All Ratings', value: '' },
                                        { label: '5 Stars', value: '5' },
                                        { label: '4 Stars', value: '4' },
                                        { label: '3 Stars', value: '3' },
                                        { label: '2 Stars', value: '2' },
                                        { label: '1 Star', value: '1' },
                                    ]}
                                    value={ratingFilter}
                                    onChange={handleRatingChange}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Status"
                                    options={[
                                        { label: 'All Status', value: '' },
                                        { label: 'Published', value: 'PUBLISHED' },
                                        { label: 'Hidden', value: 'HIDDEN' },
                                    ]}
                                    value={statusFilter}
                                    onChange={handleStatusChange}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '120px' }}>
                                <Select
                                    label="Read Status"
                                    options={[
                                        { label: 'All', value: '' },
                                        { label: 'Read', value: 'READ' },
                                        { label: 'Unread', value: 'UNREAD' },
                                    ]}
                                    value={readFilter}
                                    onChange={handleReadChange}
                                />
                            </div>
                        </div>

                        <IndexTable
                            resourceName={resourceName}
                            itemCount={reviews.length}
                            selectable={false}
                            headings={[
                                { title: "Customer" },
                                { title: "Product" },
                                { title: "Rating & Media" },
                                { title: "Comment" },
                                { title: "Status" },
                                { title: "Date" },
                                { title: "Read" },
                            ]}
                            loading={loading}
                            emptyState={
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Text as="p" variant="bodyMd" tone="subdued">
                                        Chưa có review nào. Reviews sẽ xuất hiện ở đây khi khách hàng đánh giá sản phẩm.
                                    </Text>
                                </div>
                            }
                        >
                            {rowMarkup}
                        </IndexTable>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                            <Pagination
                                hasPrevious={page > 0}
                                onPrevious={() => setPage(page - 1)}
                                hasNext={page < totalPages - 1}
                                onNext={() => setPage(page + 1)}
                            />
                        </div>
                    </Card>
                </Layout.Section>
            </Layout>

            <Modal
                open={isHideModalOpen}
                onClose={() => setIsHideModalOpen(false)}
                title="Reason for hiding review"
                primaryAction={{
                    content: 'Hide Review',
                    onAction: handleHideConfirm,
                    loading: updating === currentReview?.id
                }}
                secondaryActions={[
                    {
                        content: 'Cancel',
                        onAction: () => setIsHideModalOpen(false),
                    },
                ]}
            >
                <Modal.Section>
                    <Select
                        label="Select a reason"
                        options={hideReasons}
                        value={selectedHideReason}
                        onChange={(val: string) => setSelectedHideReason(val)}
                    />
                </Modal.Section>
            </Modal>

            {/* Replies Popup Modal */}
            <Modal
                size="large"
                open={isRepliesModalOpen}
                onClose={handleCloseRepliesModal}
                title={`Replies for review by ${parentForReplies?.customerName}`}
                primaryAction={replies.some(r => !r.isRead) ? {
                    content: 'Mark all as Read',
                    onAction: () => {
                        const allUnreadIds = replies.filter(r => !r.isRead).map(r => r.id.toString());
                        setSelectedReplies(allUnreadIds);
                    }
                } : undefined}
                secondaryActions={[
                    {
                        content: 'Close',
                        onAction: handleCloseRepliesModal,
                    },
                ]}
            >
                <Modal.Section>
                    {loadingReplies ? (
                         <div style={{ textAlign: 'center', padding: '20px' }}><Text as="p">Loading replies...</Text></div>
                    ) : replies.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}><Text as="p">No replies found.</Text></div>
                    ) : (
                        <IndexTable
                            resourceName={{ singular: 'reply', plural: 'replies' }}
                            itemCount={replies.length}
                            headings={[
                                { title: 'Customer' },
                                { title: 'Comment' },
                                { title: 'Media' },
                                { title: 'Status & Action' },
                                { title: 'Date' },
                                { title: 'Read' }
                            ]}
                            selectable={false}
                        >
                            {replies.map((reply, index) => {
                                const isPublished = reply.status === 'PUBLISHED';
                                const isHidden = reply.status === 'HIDDEN';
                                return (
                                    <IndexTable.Row 
                                        id={reply.id.toString()} 
                                        key={reply.id} 
                                        position={index}
                                    >
                                        <IndexTable.Cell>
                                            <Text variant="bodyMd" fontWeight="bold" as="span">{reply.customerName || 'Anonymous'}</Text>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>
                                            <div style={{ whiteSpace: 'normal', minWidth: '300px', maxWidth: '550px', wordBreak: 'break-word' }}>
                                               <ExpandableComment 
                                                   text={reply.comment} 
                                                   isExpanded={expandedId === `reply-${reply.id}`}
                                                   onToggle={() => setExpandedId(expandedId === `reply-${reply.id}` ? null : `reply-${reply.id}`)}
                                               />
                                            </div>
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>
                                            {reply.media && reply.media.length > 0 && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {reply.media.map(m => (
                                                        <div 
                                                            key={m.id} 
                                                            onClick={() => setZoomedImage(m.mediaUrl)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <Thumbnail
                                                                source={m.mediaType === "IMAGE" ? m.mediaUrl : ""}
                                                                alt="media"
                                                                size="small"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </IndexTable.Cell>
                                         <IndexTable.Cell>
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Badge tone={isPublished ? 'success' : 'critical'}>
                                                        {isPublished ? 'Published' : 'Hidden'}
                                                    </Badge>
                                                    <Button
                                                        size="micro"
                                                        onClick={() => handleToggleStatus(reply, true)}
                                                        loading={updating === reply.id}
                                                    >
                                                        {isPublished ? "Hide" : "Publish"}
                                                    </Button>
                                                </div>
                                                {isHidden && reply.hideReason && (
                                                    <Badge tone="warning" size="small">
                                                        {`Reason: ${reply.hideReason}`}
                                                    </Badge>
                                                )}
                                            </div>
                                         </IndexTable.Cell>
                                        <IndexTable.Cell>
                                            {new Date(reply.createdAt).toLocaleString()}
                                        </IndexTable.Cell>
                                        <IndexTable.Cell>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Checkbox
                                                    label=""
                                                    checked={reply.isRead || selectedReplies.includes(reply.id.toString())}
                                                    disabled={reply.isRead}
                                                    onChange={(val) => handleRepliesSelectionChange('one', val, reply.id.toString())}
                                                />
                                            </div>
                                        </IndexTable.Cell>
                                    </IndexTable.Row>
                                );
                            })}
                        </IndexTable>
                    )}
                </Modal.Section>
            </Modal>

            {/* Image Zoom Modal */}
            <Modal
                open={!!zoomedImage}
                onClose={() => setZoomedImage(null)}
                title="View Image"
                size="large"
                secondaryActions={[
                    {
                        content: 'Close',
                        onAction: () => setZoomedImage(null),
                    },
                ]}
            >
                <Modal.Section>
                    {zoomedImage && (
                        <div style={{ display: 'flex', justifyContent: 'center', background: '#f6f6f7', padding: '20px' }}>
                            <img 
                                src={zoomedImage} 
                                alt="Zoomed review media" 
                                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
                            />
                        </div>
                    )}
                </Modal.Section>
            </Modal>
        </Page>
    );
}
